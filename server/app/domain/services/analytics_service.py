from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models import PnLResponse, PnLPosition, HistoricalPortfolioResponse, HistoricalDataPoint
from ..repositories import portfolio_repo
from .portfolio_service import ensure_owner
from ...pricing.stub_provider import get_price


def portfolio_pnl(db: Session, user_id: str, portfolio_id: uuid.UUID) -> PnLResponse:
    from ...pricing.yahoo_provider import get_prices_batch as yahoo_get_prices_batch

    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)

    # Batch fetch all prices to avoid N+1
    symbols = [h.symbol for h in p.holdings]
    batched_prices = yahoo_get_prices_batch(symbols) if symbols else {}

    positions: list[PnLPosition] = []
    total = Decimal("0")
    for h in p.holdings:
        price = batched_prices.get(h.symbol) or get_price(h.symbol)
        unreal = (price - Decimal(str(h.average_cost))) * Decimal(str(h.quantity))
        positions.append(
            PnLPosition(
                symbol=h.symbol,
                quantity=h.quantity,
                average_cost=h.average_cost,
                price=price,
                unrealized_pnl=unreal,
            )
        )
        total += unreal
    return PnLResponse(
        portfolio_id=p.id,
        as_of=datetime.now(timezone.utc),
        total_unrealized_pnl=total,
        positions=positions,
    )


def portfolio_historical(db: Session, user_id: str, portfolio_id: uuid.UUID, days: int = 30) -> HistoricalPortfolioResponse:
    """Generate historical portfolio value using real price data from Yahoo Finance."""
    from ...pricing.yahoo_provider import get_historical_prices, get_prices_batch as yahoo_get_prices_batch

    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)

    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)

    if not p.holdings:
        return HistoricalPortfolioResponse(
            portfolio_id=p.id,
            data=[],
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            current_value=Decimal("0"),
        )

    # Pre-fetch current prices in batch
    symbols = [h.symbol for h in p.holdings]
    batched_prices = yahoo_get_prices_batch(symbols)

    # Fetch historical prices for each holding
    holding_prices = {}
    current_value = Decimal("0")

    for h in p.holdings:
        history = get_historical_prices(h.symbol, days + 5)  # extra days buffer
        current_price = batched_prices.get(h.symbol) or get_price(h.symbol)
        current_value += current_price * Decimal(str(h.quantity))

        if history:
            # Build date->price map from real data
            price_map = {item["date"]: item["price"] for item in history}
            holding_prices[h.symbol] = {
                "price_map": price_map,
                "quantity": Decimal(str(h.quantity)),
                "purchase_date": h.first_purchase_date or (end_date - timedelta(days=days)).date(),
                "current_price": current_price,
                "purchase_price": Decimal(str(h.average_cost)),
            }
        else:
            # Fallback: linear interpolation from purchase price to current price
            holding_prices[h.symbol] = {
                "price_map": None,  # signals to use interpolation
                "quantity": Decimal(str(h.quantity)),
                "purchase_date": h.first_purchase_date or (end_date - timedelta(days=days)).date(),
                "current_price": current_price,
                "purchase_price": Decimal(str(h.average_cost)),
            }

    # Calculate daily portfolio value
    data = []
    for i in range(days + 1):
        current_date = (start_date + timedelta(days=i)).date()
        daily_value = Decimal("0")

        for symbol, info in holding_prices.items():
            purchase_date = info["purchase_date"]
            if current_date < purchase_date:
                continue

            quantity = info["quantity"]

            if info["price_map"] is not None:
                # Use real price data
                price = info["price_map"].get(current_date)
                if price is None:
                    # Find nearest available price (weekends/holidays)
                    available_dates = sorted(info["price_map"].keys())
                    nearest = None
                    for d in reversed(available_dates):
                        if d <= current_date:
                            nearest = d
                            break
                    if nearest:
                        price = info["price_map"][nearest]
                    else:
                        price = info["purchase_price"]
            else:
                # Linear interpolation fallback
                days_held = (end_date.date() - purchase_date).days or 1
                progress = (current_date - purchase_date).days / days_held
                progress = max(0, min(1, progress))
                price = info["purchase_price"] + (info["current_price"] - info["purchase_price"]) * Decimal(str(progress))

            daily_value += price * quantity

        data.append(HistoricalDataPoint(
            date=current_date.strftime("%Y-%m-%d"),
            value=daily_value,
        ))

    return HistoricalPortfolioResponse(
        portfolio_id=p.id,
        data=data,
        start_date=start_date.strftime("%Y-%m-%d"),
        end_date=end_date.strftime("%Y-%m-%d"),
        current_value=current_value,
    )
