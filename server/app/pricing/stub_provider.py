from __future__ import annotations

from decimal import Decimal


def get_price(symbol: str) -> Decimal:
    # Deterministic pseudo price
    base = 50
    h = abs(hash(symbol.upper())) % 100
    return Decimal(base + h / 5)  # increments of 0.2
