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


@router.get("/portfolios/{portfolio_id}/correlation-matrix")
def get_correlation_matrix(
    portfolio_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user),
):
    return efficient_frontier_service.compute_correlation_matrix(
        db, user_id, portfolio_id
    )


@router.get("/portfolios/{portfolio_id}/efficient-frontier/simulation")
def get_monte_carlo_frontier(
    portfolio_id: uuid.UUID,
    samples: int = Query(default=10_000, ge=100, le=10_000),
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user),
):
    """Sample `samples` random weight vectors and return their risk/return metrics.

    The response includes all simulated portfolios (without per-sample weights)
    plus the min-variance and max-Sharpe portfolios found in the sample set,
    the current portfolio, and (if set) the target portfolio — all with full
    weight breakdowns.
    """
    return efficient_frontier_service.compute_monte_carlo_frontier(
        db, user_id, portfolio_id, num_samples=samples
    )
