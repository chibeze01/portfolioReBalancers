# Portfolio ReBalancer

AI-powered portfolio management and rebalancing tool. Track holdings, visualize performance, compute efficient frontiers, and get actionable rebalancing recommendations.

## Features

- **Portfolio Management** — Create and manage multiple investment portfolios
- **Holdings Tracking** — Add stocks with weighted average cost basis, track P&L
- **Rebalancing** — Set target allocations and see recommended trades
- **Efficient Frontier** — Visualize optimal risk/return tradeoffs using mean-variance optimization
- **Recommendations** — AI-powered sector diversification suggestions
- **Historical Charts** — 30-day portfolio value trends with real market data
- **Import/Export** — CSV import and export for portfolio holdings
- **Dark/Light Theme** — Modern UI with theme toggle

## Quick Start (Docker)

```bash
docker compose up --build
```

- **App**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

Demo account: `demo@example.com` / `password`

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+

### Backend

```bash
cd server
pip install -r requirements.txt
# Create database
psql -U postgres -c "CREATE DATABASE portfolio;"
# Start server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd app
npm install
npm run dev
```

### Environment Variables

See `server/.env.example` and `app/.env.example` for required configuration.

## Architecture

```
portfolioReBalancers/
├── app/          # React + TypeScript + Vite frontend
├── server/       # FastAPI + SQLAlchemy backend
├── landing/      # Marketing landing page
└── docker-compose.yml
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/register` | Create account |
| `POST /api/v1/auth/login` | Login |
| `GET /api/v1/portfolios` | List portfolios |
| `POST /api/v1/portfolios` | Create portfolio |
| `POST /api/v1/portfolios/{id}/holdings` | Add/update holding |
| `GET /api/v1/portfolios/{id}/pnl` | Get P&L |
| `GET /api/v1/portfolios/{id}/historical` | Historical values |
| `GET /api/v1/portfolios/{id}/rebalance` | Compute rebalance |
| `PUT /api/v1/portfolios/{id}/holdings/allocations` | Set target allocations |
| `GET /api/v1/portfolios/{id}/efficient-frontier` | Efficient frontier |
| `GET /api/v1/recommendations/portfolio/{id}` | Recommendations |
| `GET /api/v1/portfolios/{id}/export` | Export CSV |
| `POST /api/v1/portfolios/{id}/import` | Import CSV |

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: FastAPI, SQLAlchemy 2.0, PostgreSQL, Pydantic v2
- **Auth**: Local JWT (HS256 + bcrypt)
- **Data**: Yahoo Finance (yfinance)
- **Optimization**: NumPy, SciPy (mean-variance optimization)
