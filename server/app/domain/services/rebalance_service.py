from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from ..models import RebalanceAction, RebalanceResponse
from ..repositories import portfolio_repo
from .portfolio_service import ensure_owner
from ...pricing.stub_provider import get_price


def compute_rebalance(db: Session, user_id: str, portfolio_id: uuid.UUID) -> RebalanceResponse:
    """Compute rebalance actions for a portfolio based on target allocations."""
    from ...pricing.yahoo_provider import get_prices_batch

    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)

    # Calculate current values
    holdings_data = []
    total_value = Decimal("0")

    # Fetch all prices in one batch to prevent N+1 queries
    symbols = [h.symbol for h in p.holdings]
    prices_batch = get_prices_batch(symbols) if symbols else {}

    for h in p.holdings:
        price = prices_batch.get(h.symbol.upper()) or get_price(h.symbol)
        value = price * Decimal(str(h.quantity))
        total_value += value
        holdings_data.append({
            "holding": h,
            "price": price,
            "value": value,
        })

    if total_value == 0:
        return RebalanceResponse(
            portfolio_id=str(portfolio_id),
            total_value=0,
            actions=[],
            as_of=datetime.now(timezone.utc),
        )

    actions = []
    for item in holdings_data:
        h = item["holding"]
        price = item["price"]
        value = item["value"]
        current_alloc = float(value / total_value * 100)
        target_alloc = float(h.target_allocation) if h.target_allocation is not None else current_alloc

        target_value = float(total_value) * target_alloc / 100
        delta_value = target_value - float(value)
        delta_shares = delta_value / float(price) if float(price) > 0 else 0

        # Determine action: Hold if delta is less than 1% of total value
        threshold = float(total_value) * 0.01
        if abs(delta_value) < threshold:
            action = "Hold"
        elif delta_value > 0:
            action = "Buy"
        else:
            action = "Sell"

        actions.append(RebalanceAction(
            symbol=h.symbol,
            current_allocation=round(current_alloc, 2),
            target_allocation=round(target_alloc, 2),
            current_value=round(float(value), 2),
            target_value=round(target_value, 2),
            delta_value=round(delta_value, 2),
            delta_shares=round(delta_shares, 4),
            action=action,
            current_price=round(float(price), 2),
        ))

    return RebalanceResponse(
        portfolio_id=str(portfolio_id),
        total_value=round(float(total_value), 2),
        actions=actions,
        as_of=datetime.now(timezone.utc),
    )


def bulk_update_allocations(db: Session, user_id: str, portfolio_id: uuid.UUID, allocations: list[dict]) -> None:
    """Bulk update target allocations for holdings in a portfolio."""
    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)

    # Build a map of holding_id -> target_allocation
    alloc_map = {str(a["holding_id"]): a["target_allocation"] for a in allocations}

    for h in p.holdings:
        if str(h.id) in alloc_map:
            h.target_allocation = alloc_map[str(h.id)]

    db.commit()
