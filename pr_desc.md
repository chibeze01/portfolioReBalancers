💡 What
Added `get_historical_prices_batch` to `yahoo_provider.py` to efficiently fetch historical prices using a `ThreadPoolExecutor`. Updated `analytics_service.py` and `efficient_frontier_service.py` to use this new batched fetch pattern, replacing sequential network calls within loops.

🎯 Why
Sequential network calls (the N+1 query problem) inside iterations create significant bottlenecks, severely affecting the performance when computing historical data and efficient frontiers for portfolios with many holdings. Batching the requests via multithreading significantly reduces total response time.

📊 Impact
Total response time for endpoints executing these services should be heavily reduced since historical prices are now fetched concurrently rather than sequentially. (Expected to scale better as the number of portfolio holdings increases).

🔬 Measurement
Verify by comparing response times of `/api/analytics/{portfolio_id}/historical` and `/api/efficient-frontier/{portfolio_id}` before and after this optimization using a portfolio with a large number of unique holdings.
