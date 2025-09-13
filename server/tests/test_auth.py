from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import current_user_id
import uuid


def test_unauthorized_missing_token():
    with TestClient(app) as c:
        r = c.get("/api/v1/portfolios")
        assert r.status_code == 401


def test_forbidden_other_user(client):  # uses authorized fixture to create
    # Create portfolio as default test user (fixture override applied)
    r = client.post("/api/v1/portfolios", json={"name": "Forbidden"})
    pid = r.json()["id"]
    # Switch to different user
    new_user = str(uuid.uuid4())

    def alt_user():
        return new_user

    app.dependency_overrides[current_user_id] = alt_user
    try:
        r2 = client.get(f"/api/v1/portfolios/{pid}")
        assert r2.status_code == 403
    finally:
        # cleanup left to fixture after test which clears overrides
        pass