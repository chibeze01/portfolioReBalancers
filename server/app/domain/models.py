from __future__ import annotations

from decimal import Decimal
from pydantic import BaseModel
from datetime import date, datetime
import uuid


class PortfolioOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None


class HoldingOut(BaseModel):
    id: uuid.UUID
    symbol: str
    quantity: Decimal
    average_cost: Decimal


class PortfolioDetail(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    holdings: list[HoldingOut]


class PnLPosition(BaseModel):
    symbol: str
    quantity: Decimal
    average_cost: Decimal
    price: Decimal
    unrealized_pnl: Decimal


class PnLResponse(BaseModel):
    portfolio_id: uuid.UUID
    as_of: datetime
    total_unrealized_pnl: Decimal
    positions: list[PnLPosition]


class HistoricalDataPoint(BaseModel):
    date: str
    value: Decimal


class HistoricalPortfolioResponse(BaseModel):
    portfolio_id: uuid.UUID
    data: list[HistoricalDataPoint]
    start_date: str
    end_date: str
    current_value: Decimal


class RebalanceAction(BaseModel):
    symbol: str
    current_allocation: float
    target_allocation: float
    current_value: float
    target_value: float
    delta_value: float
    delta_shares: float
    action: str  # "Buy", "Sell", or "Hold"
    current_price: float


class RebalanceResponse(BaseModel):
    portfolio_id: str
    total_value: float
    actions: list[RebalanceAction]
    as_of: datetime
