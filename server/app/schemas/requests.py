from __future__ import annotations

from decimal import Decimal
from pydantic import BaseModel, field_validator
from datetime import date


class CreatePortfolioRequest(BaseModel):
    name: str
    description: str | None = None


class UpdatePortfolioRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class CreateOrUpdateHoldingRequest(BaseModel):
    symbol: str
    quantity: Decimal
    purchase_price: Decimal
    purchase_date: date | None = None

    @field_validator("symbol")
    @classmethod
    def upper(cls, v: str) -> str:
        return v.upper()
