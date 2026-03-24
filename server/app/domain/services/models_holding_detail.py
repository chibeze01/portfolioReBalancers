"""Models for holding detail view."""
from __future__ import annotations

from decimal import Decimal
from pydantic import BaseModel
from datetime import date
import uuid


class StockMetadata(BaseModel):
    """Extended stock information."""
    symbol: str
    name: str
    sector: str | None = None
    industry: str | None = None
    market_cap: int | None = None
    pe_ratio: Decimal | None = None
    dividend_yield: Decimal | None = None
    fifty_two_week_high: Decimal | None = None
    fifty_two_week_low: Decimal | None = None


class StockPricePoint(BaseModel):
    """Single price data point."""
    date: str
    price: Decimal


class HoldingDetailResponse(BaseModel):
    """Detailed information about a specific holding."""
    # Holding info
    holding_id: uuid.UUID
    symbol: str
    quantity: Decimal
    average_cost: Decimal
    purchase_date: date | None
    
    # Current market data
    current_price: Decimal
    total_value: Decimal
    unrealized_pnl: Decimal
    pnl_percent: Decimal
    
    # Stock metadata
    metadata: StockMetadata
    
    # Price history (30 days)
    price_history: list[StockPricePoint]
