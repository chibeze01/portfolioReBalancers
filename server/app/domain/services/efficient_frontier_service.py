from __future__ import annotations

import uuid
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
import numpy as np
from scipy.optimize import minimize

from ..repositories import portfolio_repo
from .portfolio_service import ensure_owner
from ...pricing.yahoo_provider import get_historical_prices, get_price as yahoo_get_price
from ...pricing.stub_provider import get_price as stub_get_price


def _get_price(symbol: str) -> Decimal:
    return yahoo_get_price(symbol) or stub_get_price(symbol)


def compute_efficient_frontier(
    db: Session,
    user_id: str,
    portfolio_id: uuid.UUID,
    num_points: int = 30,
    risk_free_rate: float = 0.05,
) -> dict:
    """Compute the efficient frontier for a portfolio's holdings."""
    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)

    if len(p.holdings) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 holdings are required to compute an efficient frontier",
        )

    symbols = [h.symbol for h in p.holdings]
    quantities = {h.symbol: float(h.quantity) for h in p.holdings}
    n = len(symbols)

    # Fetch historical prices (90 days for better statistics)
    returns_matrix = []
    for symbol in symbols:
        history = get_historical_prices(symbol, 90)
        if not history or len(history) < 10:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient historical data for {symbol}",
            )
        prices = [float(item["price"]) for item in history]
        # Compute daily returns
        daily_returns = []
        for i in range(1, len(prices)):
            if prices[i - 1] > 0:
                daily_returns.append((prices[i] - prices[i - 1]) / prices[i - 1])
        returns_matrix.append(daily_returns)

    # Align return series to same length
    min_len = min(len(r) for r in returns_matrix)
    returns_matrix = [r[:min_len] for r in returns_matrix]
    returns_array = np.array(returns_matrix)  # shape: (n_assets, n_days)

    # Annualized expected returns and covariance
    mean_daily = np.mean(returns_array, axis=1)
    cov_daily = np.cov(returns_array)
    if cov_daily.ndim == 0:
        cov_daily = np.array([[float(cov_daily)]])

    trading_days = 252
    expected_returns = mean_daily * trading_days
    cov_matrix = cov_daily * trading_days

    # Current portfolio weights
    current_values = {}
    total_value = 0.0
    for symbol in symbols:
        price = float(_get_price(symbol))
        val = price * quantities[symbol]
        current_values[symbol] = val
        total_value += val

    current_weights = np.array([current_values[s] / total_value for s in symbols]) if total_value > 0 else np.ones(n) / n

    # Target weights (from target_allocation if set)
    target_weights = None
    has_targets = all(h.target_allocation is not None for h in p.holdings)
    if has_targets:
        target_weights = np.array([float(h.target_allocation) / 100 for h in p.holdings])

    # Portfolio metrics helper
    def port_return(w):
        return float(np.dot(w, expected_returns))

    def port_volatility(w):
        return float(np.sqrt(np.dot(w.T, np.dot(cov_matrix, w))))

    def port_sharpe(w):
        vol = port_volatility(w)
        if vol == 0:
            return 0
        return (port_return(w) - risk_free_rate) / vol

    # Optimize: find min and max return portfolios
    bounds = tuple((0, 1) for _ in range(n))
    constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1}]
    init_weights = np.ones(n) / n

    # Minimum variance portfolio
    min_var_result = minimize(
        port_volatility, init_weights, method="SLSQP",
        bounds=bounds, constraints=constraints,
    )
    min_var_weights = min_var_result.x
    min_ret = port_return(min_var_weights)

    # Maximum return portfolio (100% in highest-return asset)
    max_ret = max(expected_returns)

    # Generate frontier points
    target_returns = np.linspace(min_ret, max_ret, num_points)
    frontier_points = []

    for target_ret in target_returns:
        constraints_with_return = [
            {"type": "eq", "fun": lambda w: np.sum(w) - 1},
            {"type": "eq", "fun": lambda w, r=target_ret: port_return(w) - r},
        ]
        result = minimize(
            port_volatility, init_weights, method="SLSQP",
            bounds=bounds, constraints=constraints_with_return,
        )
        if result.success:
            w = result.x
            frontier_points.append({
                "expected_return": round(port_return(w) * 100, 4),
                "volatility": round(port_volatility(w) * 100, 4),
                "weights": {symbols[i]: round(float(w[i]) * 100, 2) for i in range(n)},
            })

    # Max Sharpe portfolio
    neg_sharpe = lambda w: -port_sharpe(w)
    sharpe_result = minimize(
        neg_sharpe, init_weights, method="SLSQP",
        bounds=bounds, constraints=constraints,
    )
    max_sharpe_weights = sharpe_result.x

    # Build response
    def point_from_weights(w, label=None):
        return {
            "expected_return": round(port_return(w) * 100, 4),
            "volatility": round(port_volatility(w) * 100, 4),
            "weights": {symbols[i]: round(float(w[i]) * 100, 2) for i in range(n)},
        }

    response = {
        "portfolio_id": str(portfolio_id),
        "frontier_points": frontier_points,
        "current_portfolio": point_from_weights(current_weights),
        "target_portfolio": point_from_weights(target_weights) if target_weights is not None else None,
        "min_variance": point_from_weights(min_var_weights),
        "max_sharpe": point_from_weights(max_sharpe_weights),
        "symbols": symbols,
        "risk_free_rate": risk_free_rate,
    }

    return response
