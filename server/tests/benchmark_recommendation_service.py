import time
from decimal import Decimal
from unittest.mock import patch

# Create mock holding class
class MockHolding:
    def __init__(self, symbol, quantity):
        self.symbol = symbol
        self.quantity = quantity

# Generate 50 test holdings
holdings = [MockHolding(f"SYM{i}", Decimal("10.0")) for i in range(50)]

def run_benchmark():
    from app.domain.services.recommendation_service import _analyze_portfolio_sectors
    start = time.time()
    result = _analyze_portfolio_sectors(holdings)
    end = time.time()
    print(f"Time taken: {end - start:.4f} seconds")
    return result

if __name__ == "__main__":
    with patch("app.pricing.yahoo_provider.get_stock_info") as mock_get_info:
        def side_effect(symbol):
            time.sleep(0.05) # simulate 50ms network request
            return {"price": 100, "sector": "Technology"}
        mock_get_info.side_effect = side_effect

        print("Running benchmark with 50 holdings using batched get_stocks_info_batch...")
        run_benchmark()
