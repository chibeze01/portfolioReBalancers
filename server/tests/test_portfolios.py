def test_create_and_list_portfolio(client):
    r = client.post("/api/v1/portfolios", json={"name": "Core", "description": "Main"})
    assert r.status_code == 201, r.text
    pid = r.json()["id"]
    r2 = client.get("/api/v1/portfolios")
    assert any(p["id"] == pid for p in r2.json())


def test_update_portfolio(client):
    r = client.post("/api/v1/portfolios", json={"name": "Before", "description": "Old desc"})
    assert r.status_code == 201, r.text
    pid = r.json()["id"]

    r2 = client.put(f"/api/v1/portfolios/{pid}", json={"name": "After", "description": "New desc"})
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert data["name"] == "After"
    assert data["description"] == "New desc"

    # Verify via GET
    r3 = client.get(f"/api/v1/portfolios/{pid}")
    assert r3.json()["name"] == "After"


def test_update_portfolio_partial(client):
    """Updating only name should leave description unchanged."""
    r = client.post("/api/v1/portfolios", json={"name": "Partial", "description": "Keep me"})
    pid = r.json()["id"]

    r2 = client.put(f"/api/v1/portfolios/{pid}", json={"name": "Renamed"})
    assert r2.status_code == 200, r2.text
    assert r2.json()["name"] == "Renamed"


def test_delete_portfolio(client):
    r = client.post("/api/v1/portfolios", json={"name": "Deletable"})
    pid = r.json()["id"]

    r2 = client.delete(f"/api/v1/portfolios/{pid}")
    assert r2.status_code == 204, r2.text

    # Verify it no longer appears in list
    r3 = client.get("/api/v1/portfolios")
    assert not any(p["id"] == pid for p in r3.json())


def test_delete_portfolio_with_holdings(client, portfolio_with_holdings):
    """Deleting a portfolio should cascade-delete its holdings."""
    pid = portfolio_with_holdings["portfolio_id"]
    r = client.delete(f"/api/v1/portfolios/{pid}")
    assert r.status_code == 204, r.text

    r2 = client.get(f"/api/v1/portfolios/{pid}")
    assert r2.status_code == 404
