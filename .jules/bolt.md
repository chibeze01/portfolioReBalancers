## 2024-03-28 - [Backend Yahoo Finance Bulk Download]
**Learning:** The application was experiencing an N+1 problem in `analytics_service` and `rebalance_service` because `get_price(h.symbol)` was called in a loop for each holding in a portfolio, triggering individual HTTP requests to Yahoo Finance for every ticker. This was not ideal and caused serious performance bottlenecks when calculating portfolio summaries.
**Action:** Implemented `get_prices_batch` in `server/app/pricing/yahoo_provider.py` using `yfinance.download(symbols_string, period="1d")` to batch requests. Replaced individual fetches in domain services with upfront bulk fetches. When optimizing similar pricing operations, always check if bulk retrieval capabilities exist for the upstream API/provider.

## 2024-05-18 - [Efficient Frontier N+1 Optimization]
**Learning:** The `efficient_frontier_service` contained an N+1 performance bottleneck similar to other domain services, individually fetching fallback stock prices inside a portfolio symbol loop.
**Action:** When working on domain services that loop over holdings or symbols, verify whether they call pricing/data-fetching functions directly in the loop. Always use or implement a batch-fetching pattern (`get_prices_batch`) first, taking care to preserve expected short-circuiting logic on failure.
