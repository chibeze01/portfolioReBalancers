from __future__ import annotations

import uuid
from decimal import Decimal
from datetime import date
from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..models import HoldingOut
from ..repositories import holding_repo, portfolio_repo
from .portfolio_service import ensure_owner


def add_or_update_holding(
    db: Session,
    user_id: str,
    portfolio_id: uuid.UUID,
    symbol: str,
    quantity: Decimal,
    purchase_price: Decimal,
    purchase_date: date | None,
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
        db.flush()
        return HoldingOut(id=existing.id, symbol=existing.symbol, quantity=existing.quantity, average_cost=existing.average_cost)
    h = holding_repo.create_holding(db, portfolio_id, symbol_norm, quantity, purchase_price, purchase_date)
    return HoldingOut(id=h.id, symbol=h.symbol, quantity=h.quantity, average_cost=h.average_cost)


def delete_holding(db: Session, user_id: str, holding_id: uuid.UUID) -> None:
    h = holding_repo.get_by_id(db, holding_id)
    if not h:
        raise HTTPException(status_code=404, detail="Holding not found")
    portfolio = portfolio_repo.get_portfolio(db, h.portfolio_id)
    ensure_owner(portfolio, user_id)
    holding_repo.delete_holding(db, h)
