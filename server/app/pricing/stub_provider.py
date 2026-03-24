"""Stub pricing provider with fallback to Yahoo Finance."""
from __future__ import annotations

import logging
from decimal import Decimal

from .yahoo_provider import get_price as yahoo_get_price

logger = logging.getLogger(__name__)


def _stub_price(symbol: str) -> Decimal:
    """Generate deterministic pseudo price for fallback."""
    base = 50
    h = abs(hash(symbol.upper())) % 100
    return Decimal(base + h / 5)  # increments of 0.2


def get_price(symbol: str) -> Decimal:
    """
    Get price for a symbol, trying Yahoo Finance first with stub fallback.
    """
    # Try Yahoo Finance first
    yahoo_price = yahoo_get_price(symbol)
    if yahoo_price is not None:
        return yahoo_price
    
    # Fallback to stub
    logger.info(f"Using stub price for {symbol}")
    return _stub_price(symbol)
