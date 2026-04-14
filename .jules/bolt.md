## 2024-03-28 - [Backend Yahoo Finance Bulk Download]
**Learning:** The application was experiencing an N+1 problem in `analytics_service` and `rebalance_service` because `get_price(h.symbol)` was called in a loop for each holding in a portfolio, triggering individual HTTP requests to Yahoo Finance for every ticker. This was not ideal and caused serious performance bottlenecks when calculating portfolio summaries.
**Action:** Implemented `get_prices_batch` in `server/app/pricing/yahoo_provider.py` using `yfinance.download(symbols_string, period="1d")` to batch requests. Replaced individual fetches in domain services with upfront bulk fetches. When optimizing similar pricing operations, always check if bulk retrieval capabilities exist for the upstream API/provider.

## 2024-06-25 - [Backend Historical Prices Bulk Fetch]
**Learning:** `analytics_service` and `efficient_frontier_service` suffered from an N+1 performance bottleneck when fetching historical prices for portfolio holdings. `get_historical_prices(symbol)` was being called sequentially for each symbol, making the API very slow for large portfolios.
**Action:** Implemented `get_historical_prices_batch` in `server/app/pricing/yahoo_provider.py` to concurrently fetch historical prices using a `ThreadPoolExecutor`. Replaced sequential fetches with batch fetches in domain services, significantly reducing response latency.
