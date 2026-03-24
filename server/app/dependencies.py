from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session
from .persistence.db import SessionLocal
from .auth.local_jwt import get_current_user_id
from typing import Generator


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def current_user_id(user_id: str = Depends(get_current_user_id)) -> str:
    return user_id


# Alias used by some routers (e.g. import_export)
require_user = current_user_id
