"""Yahoo Finance price provider using yfinance library."""
from __future__ import annotations

import logging
from decimal import Decimal
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
    Fetch prices for multiple symbols efficiently using yf.download to avoid N+1 queries.
    """
    if not symbols:
        return {}

    result = {}
    missing_symbols = []
    now = datetime.now()

    # Check cache first
    for symbol in symbols:
        sym_upper = symbol.upper()
        if sym_upper in _price_cache:
            price, cached_at = _price_cache[sym_upper]
            if now - cached_at < _CACHE_TTL:
                result[symbol] = price
                continue
        missing_symbols.append(symbol)

    if not missing_symbols:
        return result

    try:
        import yfinance as yf
        # download batch data
        # Note: yf.download returns a DataFrame where if there's >1 symbol, columns are MultiIndex (Price, Ticker)
        # We need the most recent close or current price
        # Download 5 days to ensure we get a recent price (over weekends/holidays)
        data = yf.download(missing_symbols, period="5d", progress=False)

        if data.empty:
            logger.warning(f"No price data found for batch {missing_symbols}")
            for s in missing_symbols:
                result[s] = None
            return result

        # Get the latest row which has the most recent prices
        # Use ffill to carry forward previous close if latest is NaN
        data_ffill = data.ffill()
        latest = data_ffill.iloc[-1]

        if len(missing_symbols) == 1:
            # Single symbol returns a simple index
            sym = missing_symbols[0]
            sym_upper = sym.upper()
            price_val = latest.get("Close")
            if price_val is not None and not import_math_isnan(price_val):
                price = Decimal(str(round(price_val, 2)))
                _price_cache[sym_upper] = (price, now)
                result[sym] = price
            else:
                result[sym] = None
        else:
            # Multiple symbols return a MultiIndex (Price, Ticker)
            closes = data_ffill['Close'].iloc[-1]
            for sym in missing_symbols:
                sym_upper = sym.upper()
                try:
                    price_val = closes[sym_upper]
                    if price_val is not None and not import_math_isnan(price_val):
                        price = Decimal(str(round(price_val, 2)))
                        _price_cache[sym_upper] = (price, now)
                        result[sym] = price
                    else:
                        result[sym] = None
                except Exception:
                    result[sym] = None

    except Exception as e:
        logger.warning(f"Failed to fetch batch prices for {missing_symbols}: {e}")
        for s in missing_symbols:
            # Fall back to individual fetching just in case batch failed completely
            # but yf.Ticker still works (rare, but possible)
            result[s] = get_price(s)

    return result


def import_math_isnan(val):
    import math
    try:
        return math.isnan(float(val))
    except Exception:
        return True


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
