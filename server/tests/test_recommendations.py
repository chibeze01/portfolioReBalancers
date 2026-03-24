def test_portfolio_recommendations(client, portfolio_with_holdings):
    pid = portfolio_with_holdings["portfolio_id"]
    r = client.get(f"/api/v1/recommendations/portfolio/{pid}")
    assert r.status_code == 200, r.text
    data = r.json()
    assert "recommendations" in data
    for rec in data["recommendations"]:
        assert "ticker" in rec
        assert "name" in rec
        assert "reason" in rec


def test_portfolio_recommendations_empty_portfolio(client):
    """An empty portfolio should still return recommendations (general diversification)."""
    r = client.post("/api/v1/portfolios", json={"name": "Empty Recs"})
    pid = r.json()["id"]
    r2 = client.get(f"/api/v1/recommendations/portfolio/{pid}")
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0


def test_quick_recommendations(client):
    r = client.get("/api/v1/recommendations/quick")
    assert r.status_code == 200, r.text
    data = r.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0
    for rec in data["recommendations"]:
        assert "ticker" in rec
        assert "name" in rec
        assert "reason" in rec


def test_quick_recommendations_with_tickers(client):
    """Passing owned tickers should exclude them from results."""
    r = client.get("/api/v1/recommendations/quick?current_tickers=VOO,VTI")
    assert r.status_code == 200, r.text
    data = r.json()
    returned_tickers = {rec["ticker"] for rec in data["recommendations"]}
    assert "VOO" not in returned_tickers
    assert "VTI" not in returned_tickers
