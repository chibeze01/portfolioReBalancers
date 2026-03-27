from decimal import Decimal

def test_add_holding_weighted_cost(client):
    r = client.post("/api/v1/portfolios", json={"name": "Growth"})
    pid = r.json()["id"]
    r1 = client.post(f"/api/v1/portfolios/{pid}/holdings", json={"symbol": "AAPL", "quantity": "10", "purchase_price": "100"})
    assert r1.status_code == 200
    r2 = client.post(f"/api/v1/portfolios/{pid}/holdings", json={"symbol": "AAPL", "quantity": "10", "purchase_price": "120"})
    data = r2.json()
    assert Decimal(data["quantity"]) == Decimal("20")
    # new avg should be 110
    assert Decimal(data["average_cost"]) == Decimal("110")

def test_delete_holding(client):
    r = client.post("/api/v1/portfolios", json={"name": "Delete Holding"})
    pid = r.json()["id"]

    r1 = client.post(
        f"/api/v1/portfolios/{pid}/holdings",
        json={"symbol": "TSLA", "quantity": "3", "purchase_price": "250"},
    )
    assert r1.status_code == 200
    holding_id = r1.json()["id"]

    r2 = client.delete(f"/api/v1/holdings/{holding_id}")
    assert r2.status_code == 204, r2.text

    # Verify holding is gone from the portfolio
    r3 = client.get(f"/api/v1/portfolios/{pid}")
    holdings = r3.json()["holdings"]
    assert not any(h["id"] == holding_id for h in holdings)

def test_delete_holding_not_found(client):
    import uuid
    fake_id = str(uuid.uuid4())
    r = client.delete(f"/api/v1/holdings/{fake_id}")
    assert r.status_code == 404
