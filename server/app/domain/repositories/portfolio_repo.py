from __future__ import annotations

import uuid
from sqlalchemy.orm import Session
from ...persistence import tables


def list_portfolios(db: Session, user_id: str):
    return db.query(tables.Portfolio).filter(tables.Portfolio.user_id == user_id).all()


def get_portfolio(db: Session, portfolio_id: uuid.UUID):
    return db.query(tables.Portfolio).filter(tables.Portfolio.id == portfolio_id).first()


def create_portfolio(db: Session, user_id: str, name: str, description: str | None):
    obj = tables.Portfolio(user_id=user_id, name=name, description=description)
    db.add(obj)
    db.flush()
    return obj


def update_portfolio(db: Session, portfolio: tables.Portfolio, name: str | None, description: str | None):
    if name is not None:
        portfolio.name = name
    if description is not None:
        portfolio.description = description
    db.flush()
    return portfolio


def delete_portfolio(db: Session, portfolio: tables.Portfolio):
    db.delete(portfolio)
