from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ...dependencies import get_db, current_user_id
from ...domain.services import rebalance_service

router = APIRouter(tags=["rebalance"])


class AllocationUpdate(BaseModel):
    holding_id: str
    target_allocation: float


class BulkAllocationRequest(BaseModel):
    allocations: list[AllocationUpdate]


@router.get("/portfolios/{portfolio_id}/rebalance")
def get_rebalance(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)):
    return rebalance_service.compute_rebalance(db, user_id, portfolio_id)


@router.put("/portfolios/{portfolio_id}/holdings/allocations")
def update_allocations(portfolio_id: uuid.UUID, body: BulkAllocationRequest, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)):
    rebalance_service.bulk_update_allocations(db, user_id, portfolio_id, [a.model_dump() for a in body.allocations])
    return {"status": "ok"}
