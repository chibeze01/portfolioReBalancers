from __future__ import annotations

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_URL: str = Field(..., description="SQLAlchemy database URL")
    JWT_SECRET: str = Field(..., description="Secret key for JWT signing")
    LOG_LEVEL: str = "INFO"
    ENV: str = "dev"  # dev | prod | test
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]
