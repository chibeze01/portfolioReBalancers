"""Recommendations API router."""
from __future__ import annotations

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...dependencies import get_db, current_user_id
from ...domain.services import recommendation_service


router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class Recommendation(BaseModel):
    ticker: str
    name: str
    reason: str


class RecommendationsResponse(BaseModel):
    recommendations: List[Recommendation]


@router.get("/portfolio/{portfolio_id}", response_model=RecommendationsResponse)
def get_portfolio_recommendations(
    portfolio_id: uuid.UUID,
    max_results: int = Query(default=3, ge=1, le=10),
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
):
    """Get AI-powered recommendations based on portfolio analysis."""
    recs = recommendation_service.generate_recommendations(
        db, user_id, portfolio_id, max_recommendations=max_results
    )
    return RecommendationsResponse(recommendations=recs)


@router.get("/quick", response_model=RecommendationsResponse)
def get_quick_recommendations(
    current_tickers: str = Query(default="", description="Comma-separated list of currently owned tickers"),
    max_results: int = Query(default=3, ge=1, le=10),
    user_id: str = Depends(current_user_id),
):
    """Get quick recommendations without full portfolio analysis."""
    tickers = [t.strip() for t in current_tickers.split(",") if t.strip()]
    recs = recommendation_service.get_quick_recommendations(tickers, max_results)
    return RecommendationsResponse(recommendations=recs)
