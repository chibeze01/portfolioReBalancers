def test_historical_with_holdings(client, portfolio_with_holdings):
    pid = portfolio_with_holdings["portfolio_id"]
    r = client.get(f"/api/v1/portfolios/{pid}/historical")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["portfolio_id"] == pid
    assert "data" in data
    assert "start_date" in data
    assert "end_date" in data
    assert "current_value" in data
    # Should have data points for a portfolio with holdings
    assert len(data["data"]) > 0


def test_historical_empty_portfolio(client):
    r = client.post("/api/v1/portfolios", json={"name": "Empty Historical"})
    pid = r.json()["id"]
    r2 = client.get(f"/api/v1/portfolios/{pid}/historical")
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert data["portfolio_id"] == pid
    assert data["data"] == []
    assert float(data["current_value"]) == 0


def test_pnl_returns_positions(client, portfolio_with_holdings):
    pid = portfolio_with_holdings["portfolio_id"]
    r = client.get(f"/api/v1/portfolios/{pid}/pnl")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["portfolio_id"] == pid
    assert "positions" in data
    assert len(data["positions"]) == 3
    symbols = {pos["symbol"] for pos in data["positions"]}
    assert symbols == {"AAPL", "MSFT", "GOOGL"}
    for pos in data["positions"]:
        assert "quantity" in pos
        assert "average_cost" in pos
        assert "price" in pos
        assert "unrealized_pnl" in pos
