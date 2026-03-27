import uuid
from unittest.mock import patch

def test_monte_carlo_frontier_default_samples(client, portfolio_with_holdings):
    pid = portfolio_with_holdings["portfolio_id"]

    mock_response = {
        "portfolio_id": pid,
        "simulated_portfolios": [],
        "min_variance": {},
        "max_sharpe": {},
        "current_portfolio": {},
        "target_portfolio": None,
        "symbols": ["AAPL", "MSFT", "GOOGL"],
        "risk_free_rate": 0.05,
        "num_samples": 10000,
    }

    with patch("app.api.routers.efficient_frontier.efficient_frontier_service.compute_monte_carlo_frontier", return_value=mock_response) as mock_compute:
        r = client.get(f"/api/v1/portfolios/{pid}/efficient-frontier/simulation")

        assert r.status_code == 200, r.text
        data = r.json()
        assert data["num_samples"] == 10000
        assert data["portfolio_id"] == pid
        mock_compute.assert_called_once()
        # Verify it was called with default 10000
        _, kwargs = mock_compute.call_args
        assert kwargs.get("num_samples") == 10000

def test_monte_carlo_frontier_custom_samples(client, portfolio_with_holdings):
    pid = portfolio_with_holdings["portfolio_id"]

    mock_response = {
        "portfolio_id": pid,
        "simulated_portfolios": [],
        "min_variance": {},
        "max_sharpe": {},
        "current_portfolio": {},
        "target_portfolio": None,
        "symbols": ["AAPL", "MSFT", "GOOGL"],
        "risk_free_rate": 0.05,
        "num_samples": 500,
    }

    with patch("app.api.routers.efficient_frontier.efficient_frontier_service.compute_monte_carlo_frontier", return_value=mock_response) as mock_compute:
        r = client.get(f"/api/v1/portfolios/{pid}/efficient-frontier/simulation?samples=500")

        assert r.status_code == 200, r.text
        data = r.json()
        assert data["num_samples"] == 500
        mock_compute.assert_called_once()
        _, kwargs = mock_compute.call_args
        assert kwargs.get("num_samples") == 500

def test_monte_carlo_frontier_invalid_samples_low(client, portfolio_with_holdings):
    pid = portfolio_with_holdings["portfolio_id"]

    # samples < 100 should fail validation
    r = client.get(f"/api/v1/portfolios/{pid}/efficient-frontier/simulation?samples=50")

    assert r.status_code == 422
    data = r.json()
    assert "detail" in data
    assert data["detail"][0]["loc"] == ["query", "samples"]

def test_monte_carlo_frontier_invalid_samples_high(client, portfolio_with_holdings):
    pid = portfolio_with_holdings["portfolio_id"]

    # samples > 10000 should fail validation
    r = client.get(f"/api/v1/portfolios/{pid}/efficient-frontier/simulation?samples=20000")

    assert r.status_code == 422
    data = r.json()
    assert "detail" in data
    assert data["detail"][0]["loc"] == ["query", "samples"]
