from __future__ import annotations

import uuid
import random
from decimal import Decimal
from datetime import date, datetime, timedelta, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..models import HoldingOut
from ..repositories import holding_repo, portfolio_repo
from .portfolio_service import ensure_owner
from ...pricing.stub_provider import get_price
from ...pricing.yahoo_provider import get_stock_info
from .models_holding_detail import HoldingDetailResponse, StockMetadata, StockPricePoint


def add_or_update_holding(
    db: Session,
    user_id: str,
    portfolio_id: uuid.UUID,
    symbol: str,
    quantity: Decimal,
    purchase_price: Decimal,
    purchase_date: date | None,
    target_allocation: Decimal | None = None,
) -> HoldingOut:
    if quantity <= 0 or purchase_price <= 0:
        raise HTTPException(status_code=400, detail="Quantity and price must be > 0")
    portfolio = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(portfolio, user_id)
    symbol_norm = symbol.upper()
    existing = holding_repo.find_by_symbol(db, portfolio_id, symbol_norm)
    if existing:
        old_qty = Decimal(existing.quantity)
        new_qty = old_qty + quantity
        new_avg = (old_qty * Decimal(existing.average_cost) + quantity * purchase_price) / new_qty
        existing.quantity = new_qty
        existing.average_cost = new_avg
        if existing.first_purchase_date is None:
            existing.first_purchase_date = purchase_date
        if target_allocation is not None:
            existing.target_allocation = target_allocation
        db.flush()
        return HoldingOut(id=existing.id, symbol=existing.symbol, quantity=existing.quantity, average_cost=existing.average_cost)
    h = holding_repo.create_holding(db, portfolio_id, symbol_norm, quantity, purchase_price, purchase_date, target_allocation)
    return HoldingOut(id=h.id, symbol=h.symbol, quantity=h.quantity, average_cost=h.average_cost)


def delete_holding(db: Session, user_id: str, holding_id: uuid.UUID) -> None:
    h = holding_repo.get_by_id(db, holding_id)
    if not h:
        raise HTTPException(status_code=404, detail="Holding not found")
    portfolio = portfolio_repo.get_portfolio(db, h.portfolio_id)
    ensure_owner(portfolio, user_id)
    holding_repo.delete_holding(db, h)


def get_holding_detail(db: Session, user_id: str, holding_id: uuid.UUID) -> HoldingDetailResponse:
    """Get detailed information about a specific holding."""
    holding = holding_repo.get_by_id(db, holding_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    portfolio = portfolio_repo.get_portfolio(db, holding.portfolio_id)
    ensure_owner(portfolio, user_id)
    
    # Get current price
    current_price = get_price(holding.symbol)
    quantity = Decimal(holding.quantity)
    average_cost = Decimal(holding.average_cost)
    total_value = current_price * quantity
    cost_basis = average_cost * quantity
    unrealized_pnl = total_value - cost_basis
    pnl_percent = (unrealized_pnl / cost_basis * 100) if cost_basis > 0 else Decimal("0")
    
    # Get stock metadata
    stock_info = get_stock_info(holding.symbol)
    metadata = StockMetadata(
        symbol=holding.symbol,
        name=stock_info.get('name', holding.symbol) if stock_info else holding.symbol,
        sector=stock_info.get('sector') if stock_info else None,
        industry=stock_info.get('industry') if stock_info else None,
        market_cap=stock_info.get('marketCap') if stock_info else None,
        pe_ratio=Decimal(str(stock_info.get('peRatio'))) if stock_info and stock_info.get('peRatio') else None,
        dividend_yield=Decimal(str(stock_info.get('dividendYield'))) if stock_info and stock_info.get('dividendYield') else None,
    )
    
    # Generate price history (30 days)
    price_history = _generate_price_history(
        holding.symbol,
        holding.first_purchase_date,
        average_cost,
        current_price,
        days=30
    )
    
    return HoldingDetailResponse(
        holding_id=holding.id,
        symbol=holding.symbol,
        quantity=quantity,
        average_cost=average_cost,
        purchase_date=holding.first_purchase_date,
        current_price=current_price,
        total_value=total_value,
        unrealized_pnl=unrealized_pnl,
        pnl_percent=pnl_percent,
        metadata=metadata,
        price_history=price_history,
    )


def _generate_price_history(symbol: str, purchase_date, purchase_price: Decimal, current_price: Decimal, days: int = 30) -> list[StockPricePoint]:
    """Generate simulated price history for a stock."""
    # Use deterministic seed based on symbol
    random.seed(hash(symbol) % (2**32))
    
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days)
    
    # If purchased recently, start from purchase date
    if purchase_date and purchase_date > start_date:
        start_date = purchase_date
    
    # Calculate days to generate
    total_days = (end_date - start_date).days + 1
    
    # Generate price path from start to current
    prices = []
    for i in range(total_days):
        current_date = start_date + timedelta(days=i)
        
        if i == 0:
            # First day - use purchase price if recently purchased, otherwise calculate
            if purchase_date and current_date == purchase_date:
                price = purchase_price
            else:
                # Interpolate backwards from current price
                base_price = current_price * Decimal("0.95")  # Start ~5% lower
                price = base_price
        elif i == total_days - 1:
            # Last day = current price
            price = current_price
        else:
            # Interpolate with some randomness
            progress = i / (total_days - 1)
            base_price = purchase_price + (current_price - purchase_price) * Decimal(str(progress))
            volatility = current_price * Decimal("0.015")  # 1.5% daily volatility
            random_factor = Decimal(str(random.gauss(0, 1)))
            price = base_price + volatility * random_factor
            # Clamp to reasonable bounds
            price = max(price, current_price * Decimal("0.85"))
            price = min(price, current_price * Decimal("1.15"))
        
        prices.append(StockPricePoint(
            date=current_date.strftime("%Y-%m-%d"),
            price=price,
        ))
    
    return prices
