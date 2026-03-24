from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ...dependencies import get_db, require_user
from ...domain.services import efficient_frontier_service

router = APIRouter(tags=["efficient_frontier"])


@router.get("/portfolios/{portfolio_id}/efficient-frontier")
def get_efficient_frontier(
    portfolio_id: uuid.UUID,
    points: int = Query(default=30, ge=5, le=100),
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user),
):
    return efficient_frontier_service.compute_efficient_frontier(
        db, user_id, portfolio_id, num_points=points
    )
