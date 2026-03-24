import io


def test_export_csv(client, portfolio_with_holdings):
    pid = portfolio_with_holdings["portfolio_id"]
    r = client.get(f"/api/v1/portfolios/{pid}/export")
    assert r.status_code == 200, r.text
    assert "text/csv" in r.headers["content-type"]
    content = r.text
    lines = content.strip().split("\n")
    # Header + 3 holdings
    assert len(lines) == 4
    header = lines[0]
    assert "symbol" in header
    assert "quantity" in header
    assert "average_cost" in header


def test_export_empty_portfolio(client):
    r = client.post("/api/v1/portfolios", json={"name": "Empty Export"})
    pid = r.json()["id"]
    r2 = client.get(f"/api/v1/portfolios/{pid}/export")
    assert r2.status_code == 200, r2.text
    lines = r2.text.strip().split("\n")
    # Only header row
    assert len(lines) == 1


def test_import_csv(client):
    r = client.post("/api/v1/portfolios", json={"name": "Import Target"})
    pid = r.json()["id"]

    csv_content = "symbol,quantity,average_cost,target_allocation,purchase_date\n"
    csv_content += "TSLA,5,200,,\n"
    csv_content += "AMZN,3,150,40,\n"

    r2 = client.post(
        f"/api/v1/portfolios/{pid}/import",
        files={"file": ("portfolio.csv", io.BytesIO(csv_content.encode()), "text/csv")},
    )
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert data["imported"] == 2
    assert data["errors"] == []

    # Verify holdings were created
    r3 = client.get(f"/api/v1/portfolios/{pid}")
    holdings = r3.json()["holdings"]
    symbols = {h["symbol"] for h in holdings}
    assert symbols == {"TSLA", "AMZN"}


def test_import_csv_with_errors(client):
    r = client.post("/api/v1/portfolios", json={"name": "Import Errors"})
    pid = r.json()["id"]

    csv_content = "symbol,quantity,average_cost\n"
    csv_content += ",5,200\n"          # missing symbol
    csv_content += "NFLX,,150\n"       # missing quantity
    csv_content += "GOOG,10,100\n"     # valid row

    r2 = client.post(
        f"/api/v1/portfolios/{pid}/import",
        files={"file": ("bad.csv", io.BytesIO(csv_content.encode()), "text/csv")},
    )
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert data["imported"] == 1
    assert len(data["errors"]) == 2


def test_roundtrip_export_import(client, portfolio_with_holdings):
    """Export a portfolio then import it into a new portfolio."""
    pid = portfolio_with_holdings["portfolio_id"]

    # Export
    r = client.get(f"/api/v1/portfolios/{pid}/export")
    assert r.status_code == 200
    csv_bytes = r.text.encode()

    # Create new portfolio and import
    r2 = client.post("/api/v1/portfolios", json={"name": "Roundtrip Target"})
    new_pid = r2.json()["id"]

    r3 = client.post(
        f"/api/v1/portfolios/{new_pid}/import",
        files={"file": ("export.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert r3.status_code == 200, r3.text
    data = r3.json()
    assert data["imported"] == 3
    assert data["errors"] == []
