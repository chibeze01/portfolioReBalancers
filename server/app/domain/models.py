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
