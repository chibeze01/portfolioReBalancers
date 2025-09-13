from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models import PnLResponse, PnLPosition
from ..repositories import portfolio_repo
from .portfolio_service import ensure_owner
from ...pricing.stub_provider import get_price


def portfolio_pnl(db: Session, user_id: str, portfolio_id: uuid.UUID) -> PnLResponse:
    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)
    positions: list[PnLPosition] = []
    total = Decimal("0")
    for h in p.holdings:
        price = get_price(h.symbol)
        unreal = (price - Decimal(h.average_cost)) * Decimal(h.quantity)
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
