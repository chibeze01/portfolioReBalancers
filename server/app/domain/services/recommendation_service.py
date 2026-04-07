"""Recommendation service - simple sector diversification algorithm."""
from __future__ import annotations

import logging
from typing import List, Dict, Optional
from decimal import Decimal
from sqlalchemy.orm import Session

from ..repositories import portfolio_repo
from .portfolio_service import ensure_owner
from ...pricing.yahoo_provider import get_stock_info, get_stock_info_batch

logger = logging.getLogger(__name__)

# Target sector allocations based on simplified S&P 500 weights
TARGET_SECTORS = {
    'Technology': 0.28,
    'Healthcare': 0.13,
    'Financial Services': 0.12,
    'Consumer Cyclical': 0.10,
    'Communication Services': 0.09,
    'Industrials': 0.08,
    'Consumer Defensive': 0.07,
    'Energy': 0.05,
    'Utilities': 0.03,
    'Real Estate': 0.03,
    'Basic Materials': 0.02,
}

# Recommended ETFs/stocks by sector for diversification
SECTOR_RECOMMENDATIONS = {
    'Technology': [
        {'ticker': 'VGT', 'name': 'Vanguard Information Technology ETF'},
        {'ticker': 'QQQ', 'name': 'Invesco QQQ Trust'},
        {'ticker': 'MSFT', 'name': 'Microsoft Corporation'},
    ],
    'Healthcare': [
        {'ticker': 'VHT', 'name': 'Vanguard Health Care ETF'},
        {'ticker': 'JNJ', 'name': 'Johnson & Johnson'},
        {'ticker': 'UNH', 'name': 'UnitedHealth Group'},
    ],
    'Financial Services': [
        {'ticker': 'VFH', 'name': 'Vanguard Financials ETF'},
        {'ticker': 'JPM', 'name': 'JPMorgan Chase & Co.'},
        {'ticker': 'BRK.B', 'name': 'Berkshire Hathaway Inc.'},
    ],
    'Consumer Cyclical': [
        {'ticker': 'VCR', 'name': 'Vanguard Consumer Discretionary ETF'},
        {'ticker': 'AMZN', 'name': 'Amazon.com Inc.'},
        {'ticker': 'TSLA', 'name': 'Tesla, Inc.'},
    ],
    'Communication Services': [
        {'ticker': 'VOX', 'name': 'Vanguard Communication Services ETF'},
        {'ticker': 'GOOGL', 'name': 'Alphabet Inc.'},
        {'ticker': 'META', 'name': 'Meta Platforms, Inc.'},
    ],
    'Industrials': [
        {'ticker': 'VIS', 'name': 'Vanguard Industrials ETF'},
        {'ticker': 'CAT', 'name': 'Caterpillar Inc.'},
        {'ticker': 'UNP', 'name': 'Union Pacific Corporation'},
    ],
    'Consumer Defensive': [
        {'ticker': 'VDC', 'name': 'Vanguard Consumer Staples ETF'},
        {'ticker': 'PG', 'name': 'Procter & Gamble Co.'},
        {'ticker': 'KO', 'name': 'The Coca-Cola Company'},
    ],
    'Energy': [
        {'ticker': 'VDE', 'name': 'Vanguard Energy ETF'},
        {'ticker': 'XOM', 'name': 'Exxon Mobil Corporation'},
        {'ticker': 'CVX', 'name': 'Chevron Corporation'},
    ],
    'Utilities': [
        {'ticker': 'VPU', 'name': 'Vanguard Utilities ETF'},
        {'ticker': 'NEE', 'name': 'NextEra Energy, Inc.'},
        {'ticker': 'DUK', 'name': 'Duke Energy Corporation'},
    ],
    'Real Estate': [
        {'ticker': 'VNQ', 'name': 'Vanguard Real Estate ETF'},
        {'ticker': 'AMT', 'name': 'American Tower Corporation'},
        {'ticker': 'PLD', 'name': 'Prologis, Inc.'},
    ],
    'Basic Materials': [
        {'ticker': 'VAW', 'name': 'Vanguard Materials ETF'},
        {'ticker': 'LIN', 'name': 'Linde plc'},
        {'ticker': 'APD', 'name': 'Air Products and Chemicals'},
    ],
}

# General diversification recommendations (always good to have)
GENERAL_RECOMMENDATIONS = [
    {'ticker': 'VOO', 'name': 'Vanguard S&P 500 ETF', 'reason': 'Broad market exposure to diversify portfolio.'},
    {'ticker': 'VTI', 'name': 'Vanguard Total Stock Market ETF', 'reason': 'Total US market exposure for complete diversification.'},
    {'ticker': 'VXUS', 'name': 'Vanguard Total International Stock ETF', 'reason': 'International exposure to reduce US concentration.'},
    {'ticker': 'BND', 'name': 'Vanguard Total Bond Market ETF', 'reason': 'Fixed income for portfolio stability.'},
]


def _analyze_portfolio_sectors(holdings: list) -> Dict[str, Decimal]:
    """Analyze the sector breakdown of current holdings."""
    sector_values: Dict[str, Decimal] = {}
    total_value = Decimal('0')

    # Batch fetch all stock info to avoid N+1
    symbols = [h.symbol for h in holdings]
    batched_info = get_stock_info_batch(symbols) if symbols else {}

    for holding in holdings:
        try:
            info = batched_info.get(holding.symbol.upper())
            if info and info.get('price'):
                value = Decimal(str(info['price'])) * Decimal(str(holding.quantity))
                sector = info.get('sector') or 'Unknown'
                sector_values[sector] = sector_values.get(sector, Decimal('0')) + value
                total_value += value
        except Exception as e:
            logger.warning(f"Could not get sector info for {holding.symbol}: {e}")

    # Convert to percentages
    if total_value > 0:
        return {k: v / total_value for k, v in sector_values.items()}
    return {}


def _find_underweight_sectors(current_allocation: Dict[str, Decimal]) -> List[str]:
    """Find sectors that are underweight compared to target."""
    underweight = []

    for sector, target_pct in TARGET_SECTORS.items():
        current_pct = float(current_allocation.get(sector, 0))
        # Consider underweight if more than 5% below target
        if current_pct < target_pct - 0.05:
            underweight.append(sector)

    return underweight


def generate_recommendations(
    db: Session,
    user_id: str,
    portfolio_id,
    max_recommendations: int = 3
) -> List[Dict]:
    """
    Generate stock recommendations based on portfolio analysis.

    Simple algorithm:
    1. Get current holdings and their sectors
    2. Find underrepresented sectors
    3. Recommend stocks/ETFs from those sectors
    4. Add general diversification recommendations if needed
    """
    import uuid
    if isinstance(portfolio_id, str):
        portfolio_id = uuid.UUID(portfolio_id)

    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)

    current_tickers = {h.symbol.upper() for h in p.holdings}
    recommendations = []

    if not p.holdings:
        # Empty portfolio - suggest general diversification
        for rec in GENERAL_RECOMMENDATIONS:
            if rec['ticker'].upper() not in current_tickers:
                recommendations.append({
                    'ticker': rec['ticker'],
                    'name': rec['name'],
                    'reason': rec['reason'],
                })
                if len(recommendations) >= max_recommendations:
                    break
        return recommendations

    # Analyze current portfolio
    sector_allocation = _analyze_portfolio_sectors(p.holdings)
    underweight_sectors = _find_underweight_sectors(sector_allocation)

    # Get recommendations from underweight sectors
    for sector in underweight_sectors:
        if sector in SECTOR_RECOMMENDATIONS:
            for stock in SECTOR_RECOMMENDATIONS[sector]:
                if stock['ticker'].upper() not in current_tickers:
                    target_pct = TARGET_SECTORS.get(sector, 0.1)
                    current_pct = float(sector_allocation.get(sector, 0))
                    recommendations.append({
                        'ticker': stock['ticker'],
                        'name': stock['name'],
                        'reason': f'{sector} sector is underweight ({current_pct*100:.1f}% vs target {target_pct*100:.1f}%). Consider adding exposure.',
                    })
                    current_tickers.add(stock['ticker'].upper())
                    break  # One recommendation per sector

        if len(recommendations) >= max_recommendations:
            break

    # Fill remaining slots with general recommendations
    if len(recommendations) < max_recommendations:
        for rec in GENERAL_RECOMMENDATIONS:
            if rec['ticker'].upper() not in current_tickers:
                recommendations.append({
                    'ticker': rec['ticker'],
                    'name': rec['name'],
                    'reason': rec['reason'],
                })
                if len(recommendations) >= max_recommendations:
                    break

    return recommendations


def get_quick_recommendations(current_tickers: List[str], max_recommendations: int = 3) -> List[Dict]:
    """
    Quick recommendations without portfolio analysis.
    Used when portfolio data isn't available or for quick suggestions.
    """
    current_set = {t.upper() for t in current_tickers}
    recommendations = []

    # Start with general recommendations
    for rec in GENERAL_RECOMMENDATIONS:
        if rec['ticker'].upper() not in current_set:
            recommendations.append(rec)
            if len(recommendations) >= max_recommendations:
                break

    # Add some popular individual stocks
    popular_stocks = [
        {'ticker': 'AAPL', 'name': 'Apple Inc.', 'reason': 'Strong fundamentals and consistent growth.'},
        {'ticker': 'NVDA', 'name': 'NVIDIA Corporation', 'reason': 'Leader in AI and GPU technology.'},
        {'ticker': 'GOOGL', 'name': 'Alphabet Inc.', 'reason': 'Dominant position in digital advertising and cloud.'},
        {'ticker': 'MSFT', 'name': 'Microsoft Corporation', 'reason': 'Cloud growth and enterprise software leader.'},
        {'ticker': 'JPM', 'name': 'JPMorgan Chase & Co.', 'reason': 'Strong financial sector exposure.'},
    ]

    for stock in popular_stocks:
        if len(recommendations) >= max_recommendations:
            break
        if stock['ticker'].upper() not in current_set:
            recommendations.append(stock)

    return recommendations[:max_recommendations]
