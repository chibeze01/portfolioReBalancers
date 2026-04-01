import uuid
from unittest.mock import patch
from app.api.routers import efficient_frontier

# We patch the service used by the router
@patch("app.api.routers.efficient_frontier.efficient_frontier_service.compute_efficient_frontier")
def test_get_efficient_frontier_default_points(mock_compute, client):
    # Setup mock return value
    mock_compute.return_value = {
        "portfolio_id": "test-uuid",
        "frontier_points": [],
        "current_portfolio": {},
        "target_portfolio": None,
        "min_variance": {},
        "max_sharpe": {},
        "symbols": ["AAPL", "MSFT"],
        "risk_free_rate": 0.05,
    }

    pid = str(uuid.uuid4())
    response = client.get(f"/api/v1/portfolios/{pid}/efficient-frontier")

    assert response.status_code == 200
    data = response.json()
    assert data["portfolio_id"] == "test-uuid"
    assert "frontier_points" in data

    # Verify the mock was called with default points=30
    mock_compute.assert_called_once()
    kwargs = mock_compute.call_args.kwargs
    assert kwargs.get("num_points") == 30
    assert str(mock_compute.call_args.args[2]) == pid

@patch("app.api.routers.efficient_frontier.efficient_frontier_service.compute_efficient_frontier")
def test_get_efficient_frontier_custom_points(mock_compute, client):
    mock_compute.return_value = {"success": True}

    pid = str(uuid.uuid4())
    response = client.get(f"/api/v1/portfolios/{pid}/efficient-frontier?points=15")

    assert response.status_code == 200

    # Verify the mock was called with custom points=15
    mock_compute.assert_called_once()
    kwargs = mock_compute.call_args.kwargs
    assert kwargs.get("num_points") == 15

def test_get_efficient_frontier_points_too_low(client):
    pid = str(uuid.uuid4())
    response = client.get(f"/api/v1/portfolios/{pid}/efficient-frontier?points=4")

    # Should fail validation (ge=5)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any("points" in err["loc"] for err in data["detail"])

def test_get_efficient_frontier_points_too_high(client):
    pid = str(uuid.uuid4())
    response = client.get(f"/api/v1/portfolios/{pid}/efficient-frontier?points=101")

    # Should fail validation (le=100)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any("points" in err["loc"] for err in data["detail"])
