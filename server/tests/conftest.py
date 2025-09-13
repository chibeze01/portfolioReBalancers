import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db, current_user_id
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
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
