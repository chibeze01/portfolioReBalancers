## 2024-03-28 - [Backend Yahoo Finance Bulk Download]
**Learning:** The application was experiencing an N+1 problem in `analytics_service` and `rebalance_service` because `get_price(h.symbol)` was called in a loop for each holding in a portfolio, triggering individual HTTP requests to Yahoo Finance for every ticker. This was not ideal and caused serious performance bottlenecks when calculating portfolio summaries.
**Action:** Implemented `get_prices_batch` in `server/app/pricing/yahoo_provider.py` using `yfinance.download(symbols_string, period="1d")` to batch requests. Replaced individual fetches in domain services with upfront bulk fetches. When optimizing similar pricing operations, always check if bulk retrieval capabilities exist for the upstream API/provider.

## 2024-04-09 - [Recommendation Service N+1 Optimization]
**Learning:** The `recommendation_service` had an N+1 query problem similar to what was fixed previously in analytics. `get_stock_info(holding.symbol)` was called inside a loop over holdings, leading to individual API requests per holding when computing sector allocations.
**Action:** Added `get_stock_info_batch` to `yahoo_provider.py` which uses a ThreadPoolExecutor to efficiently fetch stock info concurrently, similar to `get_prices_batch`. Updated `_analyze_portfolio_sectors` in `recommendation_service.py` to use the new batch method.
