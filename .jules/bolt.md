## 2024-03-28 - [Backend Yahoo Finance Bulk Download]
**Learning:** The application was experiencing an N+1 problem in `analytics_service` and `rebalance_service` because `get_price(h.symbol)` was called in a loop for each holding in a portfolio, triggering individual HTTP requests to Yahoo Finance for every ticker. This was not ideal and caused serious performance bottlenecks when calculating portfolio summaries.
**Action:** Implemented `get_prices_batch` in `server/app/pricing/yahoo_provider.py` using `yfinance.download(symbols_string, period="1d")` to batch requests. Replaced individual fetches in domain services with upfront bulk fetches. When optimizing similar pricing operations, always check if bulk retrieval capabilities exist for the upstream API/provider.

## 2025-04-04 - Batch Requesting in Analytics Loops
**Learning:** During portfolio analysis or recommendation generation, looping through holdings and making separate external stock info requests creates severe N+1 network latency bottlenecks.
**Action:** Always pre-fetch needed price or symbol info using batch concurrent fetching techniques (like `get_stock_info_batch` or `get_prices_batch`) before processing large holding loops in the domain services.
