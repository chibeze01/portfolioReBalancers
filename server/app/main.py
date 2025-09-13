from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI
from .settings import get_settings
from .persistence.db import init_db
from .api.routers import portfolios, holdings, analytics, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML model
    init_db()
    get_settings()  # ensure settings loaded
    yield


app = FastAPI(title="Portfolio API", lifespan=lifespan, swagger_ui_parameters={"defaultModelsExpandDepth": -1})

app.include_router(health.router)
api_prefix = "/api/v1"
app.include_router(portfolios.router, prefix=api_prefix)
app.include_router(holdings.router, prefix=api_prefix)
app.include_router(holdings.delete_router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
