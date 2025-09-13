from __future__ import annotations

import uuid
from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..models import PortfolioOut, HoldingOut, PortfolioDetail
from ..repositories import portfolio_repo


def ensure_owner(portfolio, user_id: str):
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if str(portfolio.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")


def list_portfolios(db: Session, user_id: str) -> list[PortfolioOut]:
    return [PortfolioOut(id=p.id, name=p.name, description=p.description) for p in portfolio_repo.list_portfolios(db, user_id)]


def create_portfolio(db: Session, user_id: str, name: str, description: str | None) -> PortfolioOut:
    p = portfolio_repo.create_portfolio(db, user_id, name, description)
    return PortfolioOut(id=p.id, name=p.name, description=p.description)


def get_detail(db: Session, user_id: str, portfolio_id: uuid.UUID) -> PortfolioDetail:
    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)
    holdings = [HoldingOut(id=h.id, symbol=h.symbol, quantity=h.quantity, average_cost=h.average_cost) for h in p.holdings]
    return PortfolioDetail(id=p.id, name=p.name, description=p.description, holdings=holdings)


def update_portfolio(db: Session, user_id: str, portfolio_id: uuid.UUID, name: str | None, description: str | None) -> PortfolioOut:
    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)
    portfolio_repo.update_portfolio(db, p, name, description)
    return PortfolioOut(id=p.id, name=p.name, description=p.description)


def delete_portfolio(db: Session, user_id: str, portfolio_id: uuid.UUID) -> None:
    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)
    portfolio_repo.delete_portfolio(db, p)
