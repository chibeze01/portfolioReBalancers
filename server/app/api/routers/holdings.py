from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from ...dependencies import get_db, current_user_id
from ...schemas.requests import CreateOrUpdateHoldingRequest
from ...domain.services import holding_service

# Router for upsert (scoped by portfolio)
router = APIRouter(prefix="/portfolios/{portfolio_id}/holdings", tags=["holdings"])


@router.post("", status_code=200)
def add_or_update_holding(
    portfolio_id: uuid.UUID,
    body: CreateOrUpdateHoldingRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
):
    return holding_service.add_or_update_holding(
        db,
        user_id,
        portfolio_id,
        body.symbol,
        body.quantity,
        body.purchase_price,
        body.purchase_date,
    )


# Separate router for deletion by holding id (not scoped by portfolio in path)
delete_router = APIRouter(tags=["holdings"])


@delete_router.delete("/holdings/{holding_id}", status_code=204)
def delete_holding(holding_id: uuid.UUID, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)):
    holding_service.delete_holding(db, user_id, holding_id)
    return {"detail": "deleted"}
