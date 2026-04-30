## 2024-03-28 - [Backend Yahoo Finance Bulk Download]
**Learning:** The application was experiencing an N+1 problem in `analytics_service` and `rebalance_service` because `get_price(h.symbol)` was called in a loop for each holding in a portfolio, triggering individual HTTP requests to Yahoo Finance for every ticker. This was not ideal and caused serious performance bottlenecks when calculating portfolio summaries.
**Action:** Implemented `get_prices_batch` in `server/app/pricing/yahoo_provider.py` using `yfinance.download(symbols_string, period="1d")` to batch requests. Replaced individual fetches in domain services with upfront bulk fetches. When optimizing similar pricing operations, always check if bulk retrieval capabilities exist for the upstream API/provider.

## 2024-04-30 - [Backend Yahoo Finance Historical Bulk Download]
**Learning:** Found another N+1 bottleneck when fetching historical prices in `analytics_service` and `efficient_frontier_service` because `get_historical_prices` was called in a loop for each symbol.
**Action:** Implemented `get_historical_prices_batch` in `server/app/pricing/yahoo_provider.py` using `ThreadPoolExecutor` and replaced the loops in both services with this new batch function. Always remember to clean up dirty files like test.db or python patching scripts from the workspace before requesting a code review or committing.
