from __future__ import annotations

import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select
from ...persistence import tables


def get_by_id(db: Session, holding_id: uuid.UUID):
    return db.query(tables.Holding).filter(tables.Holding.id == holding_id).first()


def find_by_symbol(db: Session, portfolio_id: uuid.UUID, symbol: str):
    return (
        db.query(tables.Holding)
        .filter(tables.Holding.portfolio_id == portfolio_id, tables.Holding.symbol == symbol)
        .first()
    )


def create_holding(db: Session, portfolio_id: uuid.UUID, symbol: str, quantity, avg_cost, first_purchase_date):
    obj = tables.Holding(
        portfolio_id=portfolio_id,
        symbol=symbol,
        quantity=quantity,
        average_cost=avg_cost,
        first_purchase_date=first_purchase_date,
    )
    db.add(obj)
    db.flush()
    return obj


def delete_holding(db: Session, holding: tables.Holding):
    db.delete(holding)
