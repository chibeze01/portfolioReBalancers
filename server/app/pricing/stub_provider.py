"""Stub pricing provider with fallback to Yahoo Finance."""
from __future__ import annotations

import logging
from decimal import Decimal

from .yahoo_provider import get_price as yahoo_get_price, get_prices_batch as yahoo_get_prices_batch

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

def get_prices(symbols: list[str]) -> dict[str, Decimal]:
    """
    Get prices for multiple symbols efficiently, with stub fallback.
    """
    results = {}

    # Try Yahoo Finance batch first
    yahoo_prices = yahoo_get_prices_batch(symbols)

    for symbol in symbols:
        sym_upper = symbol.upper()
        if yahoo_prices.get(sym_upper) is not None:
            results[symbol] = yahoo_prices[sym_upper]
        else:
            logger.info(f"Using stub price for {symbol} in batch")
            results[symbol] = _stub_price(symbol)

    return results
