from __future__ import annotations

from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from ..settings import get_settings
from .base import Base

settings = get_settings()

if "sqlite" in settings.DB_URL:
    engine = create_engine(
        settings.DB_URL,
        echo=False,
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
else:
    engine = create_engine(settings.DB_URL, echo=False, future=True)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, class_=Session, autoflush=False)

def init_db() -> None:
    from . import tables
    # For MVP: auto create in dev/test. Prod should rely on Alembic migration.
    Base.metadata.create_all(bind=engine)

@contextmanager
def session_scope() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
