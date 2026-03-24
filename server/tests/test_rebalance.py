def test_rebalance_with_allocations(client, portfolio_with_allocations):
    pid = portfolio_with_allocations["portfolio_id"]
    r = client.get(f"/api/v1/portfolios/{pid}/rebalance")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["portfolio_id"] == pid
    assert "total_value" in data
    assert "actions" in data
    assert "as_of" in data
    assert len(data["actions"]) == 3
    for action in data["actions"]:
        assert "symbol" in action
        assert "current_allocation" in action
        assert "target_allocation" in action
        assert "action" in action
        assert action["action"] in ("Buy", "Sell", "Hold")


def test_rebalance_empty_portfolio(client):
    r = client.post("/api/v1/portfolios", json={"name": "Empty Rebalance"})
    pid = r.json()["id"]
    r2 = client.get(f"/api/v1/portfolios/{pid}/rebalance")
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert data["actions"] == []
    assert data["total_value"] == 0


def test_bulk_update_allocations(client, portfolio_with_holdings):
    pid = portfolio_with_holdings["portfolio_id"]
    holdings = portfolio_with_holdings["holdings"]

    allocations = [
        {"holding_id": holdings[0]["id"], "target_allocation": 50.0},
        {"holding_id": holdings[1]["id"], "target_allocation": 30.0},
        {"holding_id": holdings[2]["id"], "target_allocation": 20.0},
    ]

    r = client.put(
        f"/api/v1/portfolios/{pid}/holdings/allocations",
        json={"allocations": allocations},
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "ok"

    # Verify via rebalance that allocations were applied
    r2 = client.get(f"/api/v1/portfolios/{pid}/rebalance")
    assert r2.status_code == 200, r2.text
    actions = {a["symbol"]: a for a in r2.json()["actions"]}
    assert actions["AAPL"]["target_allocation"] == 50.0
    assert actions["MSFT"]["target_allocation"] == 30.0
    assert actions["GOOGL"]["target_allocation"] == 20.0
