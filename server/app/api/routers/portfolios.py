from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from ...dependencies import get_db, current_user_id
from ...schemas.requests import CreatePortfolioRequest, UpdatePortfolioRequest
from ...domain import services

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.get("", status_code=200)
def list_portfolios(db: Session = Depends(get_db), user_id: str = Depends(current_user_id)):
    return services.portfolio_service.list_portfolios(db, user_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_portfolio(body: CreatePortfolioRequest, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)):
    return services.portfolio_service.create_portfolio(db, user_id, body.name, body.description)


@router.get("/{portfolio_id}")
def get_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)):
    return services.portfolio_service.get_detail(db, user_id, portfolio_id)


@router.put("/{portfolio_id}")
def update_portfolio(portfolio_id: uuid.UUID, body: UpdatePortfolioRequest, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)):
    return services.portfolio_service.update_portfolio(db, user_id, portfolio_id, body.name, body.description)


@router.delete("/{portfolio_id}", status_code=204)
def delete_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)):
    services.portfolio_service.delete_portfolio(db, user_id, portfolio_id)
    return {"detail": "deleted"}
