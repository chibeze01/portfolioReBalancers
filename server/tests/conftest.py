import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db, current_user_id, require_user
from app.persistence.db import SessionLocal, init_db


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()
    yield


TEST_USER = str(uuid.uuid4())
OTHER_USER = str(uuid.uuid4())


def override_current_user():
    return TEST_USER


@pytest.fixture()
def client():
    app.dependency_overrides[current_user_id] = override_current_user
    app.dependency_overrides[require_user] = override_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def portfolio_with_holdings(client):
    """Create a portfolio with 3 sample holdings (AAPL, MSFT, GOOGL)."""
    r = client.post("/api/v1/portfolios", json={"name": "Test Holdings Portfolio"})
    assert r.status_code == 201, r.text
    pid = r.json()["id"]

    holdings = []
    for symbol, qty, price in [("AAPL", "10", "150"), ("MSFT", "5", "300"), ("GOOGL", "8", "140")]:
        r = client.post(
            f"/api/v1/portfolios/{pid}/holdings",
            json={"symbol": symbol, "quantity": qty, "purchase_price": price},
        )
        assert r.status_code == 200, r.text
        holdings.append(r.json())

    return {"portfolio_id": pid, "holdings": holdings}


@pytest.fixture()
def portfolio_with_allocations(client):
    """Create a portfolio with 3 sample holdings that have target_allocation set."""
    r = client.post("/api/v1/portfolios", json={"name": "Allocation Portfolio"})
    assert r.status_code == 201, r.text
    pid = r.json()["id"]

    holdings = []
    for symbol, qty, price, alloc in [("AAPL", "10", "150", "50"), ("MSFT", "5", "300", "30"), ("GOOGL", "8", "140", "20")]:
        r = client.post(
            f"/api/v1/portfolios/{pid}/holdings",
            json={
                "symbol": symbol,
                "quantity": qty,
                "purchase_price": price,
                "target_allocation": alloc,
            },
        )
        assert r.status_code == 200, r.text
        holdings.append(r.json())

    return {"portfolio_id": pid, "holdings": holdings}
