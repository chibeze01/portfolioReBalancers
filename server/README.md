# Portfolio Rebalancer MVP

Minimal FastAPI service for portfolios & holdings with Supabase JWT auth (MVP scope only).

## Features

- Supabase JWT verification (RS256 JWKS)
- Portfolios CRUD
- Holdings upsert (weighted average cost)
- Unrealized PnL (stub pricing)
- Health endpoint

## Run (Dev)

Create `.env` from `.env.example` then:

```bash
uvicorn app.main:app --reload
```

Ensure Postgres running & DB exists. Alembic initial migration provided; in dev the app auto-creates tables.

## Tests

Simplistic pytest tests (override auth dependency).

```bash
pytest -q
```

## Notes

MVP only. No transactions, dividends, realized PnL, background jobs, caching or pagination.
