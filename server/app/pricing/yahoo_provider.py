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
    Fetch prices for multiple symbols efficiently in a single batch request
    to Yahoo Finance to avoid N+1 query performance issues.
    """
    if not symbols:
        return {}

    now = datetime.now()
    result = {}
    missing_symbols = []

    # 1. Check cache first
    for symbol in symbols:
        sym_upper = symbol.upper()
        if sym_upper in _price_cache:
            price, cached_at = _price_cache[sym_upper]
            if now - cached_at < _CACHE_TTL:
                result[sym_upper] = price
                continue
        missing_symbols.append(sym_upper)

    # 2. Fetch missing symbols in batch
    if missing_symbols:
        try:
            import yfinance as yf
            import pandas as pd

            # Use yf.download for batch fetching, which is significantly faster
            # than creating Ticker objects one by one
            data = yf.download(missing_symbols, period="1d", progress=False)

            if not data.empty and "Close" in data:
                close_data = data["Close"]
                for sym in missing_symbols:
                    # When only one symbol is requested, close_data is a Series (no symbol column)
                    if len(missing_symbols) == 1:
                        price_val = close_data.iloc[-1]
                    elif sym in close_data:
                        price_val = close_data[sym].iloc[-1]
                    else:
                        price_val = None

                    if price_val is not None and not pd.isna(price_val):
                        price = Decimal(str(round(price_val, 2)))
                        result[sym] = price
                        _price_cache[sym] = (price, now)
                        logger.debug(f"Batch fetched price for {sym}: {price}")
                    else:
                        result[sym] = None
            else:
                # Fallback if download failed or returned unexpected format
                for sym in missing_symbols:
                    result[sym] = None

        except Exception as e:
            logger.warning(f"Failed to fetch batch prices for {missing_symbols}: {e}")
            for sym in missing_symbols:
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
