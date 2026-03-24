from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .settings import get_settings
from .persistence.db import init_db, SessionLocal
from .persistence.seed import ensure_demo_account
from .api.routers import portfolios, holdings, analytics, health, recommendations, auth, rebalance, import_export, efficient_frontier

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML model
    init_db()
    get_settings()  # ensure settings loaded
    # Seed demo account
    db = SessionLocal()
    try:
        ensure_demo_account(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Portfolio API", lifespan=lifespan, swagger_ui_parameters={"defaultModelsExpandDepth": -1})

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server (alternate port)
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(portfolios.router, prefix=api_prefix)
app.include_router(holdings.router, prefix=api_prefix)
app.include_router(holdings.delete_router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(recommendations.router, prefix=api_prefix)
app.include_router(rebalance.router, prefix=api_prefix)
app.include_router(import_export.router, prefix=api_prefix)
app.include_router(efficient_frontier.router, prefix=api_prefix)
