def test_create_and_list_portfolio(client):
    r = client.post("/api/v1/portfolios", json={"name": "Core", "description": "Main"})
    assert r.status_code == 201, r.text
    pid = r.json()["id"]
    r2 = client.get("/api/v1/portfolios")
    assert any(p["id"] == pid for p in r2.json())
