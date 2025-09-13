def test_pnl_endpoint(client):
    r = client.post("/api/v1/portfolios", json={"name": "Alpha"})
    pid = r.json()["id"]
    client.post(f"/api/v1/portfolios/{pid}/holdings", json={"symbol": "MSFT", "quantity": "5", "purchase_price": "200"})
    pnl = client.get(f"/api/v1/portfolios/{pid}/pnl").json()
    assert pnl["portfolio_id"] == pid
    assert "positions" in pnl and len(pnl["positions"]) == 1
