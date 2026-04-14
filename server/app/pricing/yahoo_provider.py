"""Yahoo Finance price provider using yfinance library."""
from __future__ import annotations

import logging
from decimal import Decimal
import math
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# Simple in-memory cache with TTL
_price_cache: Dict[str, tuple[Decimal, datetime]] = {}
_CACHE_TTL = timedelta(minutes=5)

# Historical price cache
_historical_cache: Dict[str, tuple[list[dict], datetime]] = {}
_HISTORICAL_CACHE_TTL = timedelta(minutes=30)


def get_price(symbol: str) -> Optional[Decimal]:
    """
    Fetch current price for a stock symbol from Yahoo Finance.

    Returns None if unable to fetch (caller should fallback to stub).
    Results are cached for 5 minutes.
    """
    symbol = symbol.upper()
    now = datetime.now()

    # Check cache
    if symbol in _price_cache:
        price, cached_at = _price_cache[symbol]
        if now - cached_at < _CACHE_TTL:
            return price

    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        info = ticker.info

        # Try different price fields
        price_value = (
            info.get('regularMarketPrice') or
            info.get('currentPrice') or
            info.get('previousClose')
        )

        if price_value is None:
            logger.warning(f"No price data found for {symbol}")
            return None

        price = Decimal(str(price_value))
        _price_cache[symbol] = (price, now)
        logger.debug(f"Fetched price for {symbol}: {price}")
        return price

    except Exception as e:
        logger.warning(f"Failed to fetch price for {symbol}: {e}")
        return None


def get_stock_info(symbol: str) -> Optional[Dict]:
    """
    Fetch extended stock information including sector and name.
    """
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        info = ticker.info

        return {
            'symbol': symbol.upper(),
            'name': info.get('shortName') or info.get('longName') or symbol,
            'sector': info.get('sector'),
            'industry': info.get('industry'),
            'price': info.get('regularMarketPrice') or info.get('currentPrice'),
            'marketCap': info.get('marketCap'),
            'peRatio': info.get('trailingPE'),
            'dividendYield': info.get('dividendYield'),
        }
    except Exception as e:
        logger.warning(f"Failed to fetch info for {symbol}: {e}")
        return None


def get_prices_batch(symbols: list[str]) -> Dict[str, Optional[Decimal]]:
    """
    Fetch prices for multiple symbols efficiently using a thread pool.
    """
    from concurrent.futures import ThreadPoolExecutor

    result = {}
    unique_symbols = list(set(symbols))
    if not unique_symbols:
        return result

    with ThreadPoolExecutor(max_workers=min(10, len(unique_symbols))) as executor:
        future_to_sym = {executor.submit(get_price, sym): sym.upper() for sym in unique_symbols}
        for future in future_to_sym:
            sym = future_to_sym[future]
            try:
                result[sym] = future.result()
            except Exception as e:
                logger.warning(f"Failed to fetch batch price for {sym}: {e}")
                result[sym] = None

    return result


def get_historical_prices_batch(symbols: list[str], days: int = 30) -> Dict[str, Optional[list[dict]]]:
    """
    Fetch historical closing prices for multiple symbols efficiently using a thread pool.
    """
    from concurrent.futures import ThreadPoolExecutor

    result = {}
    unique_symbols = list(set(symbols))
    if not unique_symbols:
        return result

    with ThreadPoolExecutor(max_workers=min(10, len(unique_symbols))) as executor:
        future_to_sym = {executor.submit(get_historical_prices, sym, days): sym.upper() for sym in unique_symbols}
        for future in future_to_sym:
            sym = future_to_sym[future]
            try:
                result[sym] = future.result()
            except Exception as e:
                logger.warning(f"Failed to fetch batch historical price for {sym}: {e}")
                result[sym] = None

    return result


def get_historical_prices(symbol: str, days: int = 30) -> Optional[list[dict]]:
    """
    Fetch historical closing prices for a symbol from Yahoo Finance.

    Returns list of {date: date, price: Decimal} or None if fetch fails.
    Results cached for 30 minutes.
    """
    symbol = symbol.upper()
    cache_key = f"{symbol}_{days}"
    now = datetime.now()

    # Check cache
    if cache_key in _historical_cache:
        data, cached_at = _historical_cache[cache_key]
        if now - cached_at < _HISTORICAL_CACHE_TTL:
            return data

    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=f"{days}d")

        if hist.empty:
            logger.warning(f"No historical data for {symbol}")
            return None

        result = []
        for date_idx, row in hist.iterrows():
            result.append({
                "date": date_idx.date(),
                "price": Decimal(str(round(row["Close"], 2))),
            })

        _historical_cache[cache_key] = (result, now)
        logger.debug(f"Fetched {len(result)} days of history for {symbol}")
        return result

    except Exception as e:
        logger.warning(f"Failed to fetch history for {symbol}: {e}")
        return None


def clear_cache():
    """Clear the price and historical caches."""
    global _price_cache, _historical_cache
    _price_cache = {}
    _historical_cache = {}
