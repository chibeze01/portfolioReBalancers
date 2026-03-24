from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ...dependencies import get_db, current_user_id
from ...domain.services import analytics_service

router = APIRouter(prefix="/portfolios/{portfolio_id}", tags=["analytics"])


@router.get("/pnl")
def pnl(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)):
    return analytics_service.portfolio_pnl(db, user_id, portfolio_id)


@router.get("/historical")
def historical(
    portfolio_id: uuid.UUID,
    days: int = Query(default=30, ge=1, le=365, description="Number of days of historical data"),
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
):
    return analytics_service.portfolio_historical(db, user_id, portfolio_id, days)
