from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...dependencies import get_db, current_user_id
from ...domain.services import analytics_service

router = APIRouter(prefix="/portfolios/{portfolio_id}/pnl", tags=["analytics"])


@router.get("")
def pnl(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)):
    return analytics_service.portfolio_pnl(db, user_id, portfolio_id)
