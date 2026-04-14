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
from ...pricing.yahoo_provider import get_historical_prices, get_historical_prices_batch, get_price as yahoo_get_price
from ...pricing.stub_provider import get_price as stub_get_price


def _get_price(symbol: str) -> Decimal:
    return yahoo_get_price(symbol) or stub_get_price(symbol)


def _load_portfolio_data(db: Session, user_id: str, portfolio_id: uuid.UUID):
    """Fetch and annualise price/return data for all holdings in a portfolio.

    Returns a dict with keys:
      symbols, n, expected_returns, cov_matrix, current_weights, target_weights
    Raises HTTPException on insufficient data.
    """
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

    # Fetch historical prices (365 days ≈ 252 trading days for stable estimates)
    returns_matrix = []
    batched_histories = get_historical_prices_batch(symbols, 365)
    for symbol in symbols:
        history = batched_histories.get(symbol.upper())
        if not history or len(history) < 60:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient historical data for {symbol}",
            )
        prices = [float(item["price"]) for item in history]
        daily_returns = [
            (prices[i] - prices[i - 1]) / prices[i - 1]
            for i in range(1, len(prices))
            if prices[i - 1] > 0
        ]
        returns_matrix.append(daily_returns)

    min_len = min(len(r) for r in returns_matrix)
    returns_matrix = [r[:min_len] for r in returns_matrix]
    returns_array = np.array(returns_matrix)  # (n_assets, n_days)

    mean_daily = np.mean(returns_array, axis=1)
    cov_daily = np.cov(returns_array)
    if cov_daily.ndim == 0:
        cov_daily = np.array([[float(cov_daily)]])

    trading_days = 252
    expected_returns = (1 + mean_daily) ** trading_days - 1
    cov_matrix = cov_daily * trading_days

    # Current portfolio weights
    current_values = {}
    total_value = 0.0
    for symbol in symbols:
        price = float(_get_price(symbol))
        val = price * quantities[symbol]
        current_values[symbol] = val
        total_value += val

    current_weights = (
        np.array([current_values[s] / total_value for s in symbols])
        if total_value > 0
        else np.ones(n) / n
    )

    has_targets = all(h.target_allocation is not None for h in p.holdings)
    target_weights = (
        np.array([float(h.target_allocation) / 100 for h in p.holdings])
        if has_targets
        else None
    )

    return {
        "symbols": symbols,
        "n": n,
        "expected_returns": expected_returns,
        "cov_matrix": cov_matrix,
        "current_weights": current_weights,
        "target_weights": target_weights,
        "portfolio_id": portfolio_id,
    }


def compute_correlation_matrix(
    db: Session,
    user_id: str,
    portfolio_id: uuid.UUID,
) -> dict:
    """Return the correlation and covariance matrices for a portfolio's holdings."""
    data = _load_portfolio_data(db, user_id, portfolio_id)
    cov_matrix = data["cov_matrix"]

    # Derive correlation matrix from covariance: corr(i,j) = cov(i,j) / (std_i * std_j)
    std_devs = np.sqrt(np.diag(cov_matrix))
    d_inv = 1.0 / std_devs
    correlation_matrix = cov_matrix * np.outer(d_inv, d_inv)
    # Clamp diagonal to exactly 1.0 (avoid floating-point drift)
    np.fill_diagonal(correlation_matrix, 1.0)

    return {
        "portfolio_id": str(portfolio_id),
        "symbols": data["symbols"],
        "correlation_matrix": correlation_matrix.tolist(),
        "covariance_matrix": cov_matrix.tolist(),
    }


def compute_efficient_frontier(
    db: Session,
    user_id: str,
    portfolio_id: uuid.UUID,
    num_points: int = 30,
    risk_free_rate: float = 0.05,
) -> dict:
    """Compute the efficient frontier for a portfolio's holdings."""
    data = _load_portfolio_data(db, user_id, portfolio_id)
    symbols = data["symbols"]
    n = data["n"]
    expected_returns = data["expected_returns"]
    cov_matrix = data["cov_matrix"]
    current_weights = data["current_weights"]
    target_weights = data["target_weights"]

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


def compute_monte_carlo_frontier(
    db: Session,
    user_id: str,
    portfolio_id: uuid.UUID,
    num_samples: int = 10_000,
    risk_free_rate: float = 0.05,
) -> dict:
    """Sample 10 000 random portfolios and return their risk/return metrics.

    Each weight vector is drawn from the uniform Dirichlet distribution so
    that weights sum to 1 and are non-negative.  Portfolio return, volatility
    and Sharpe ratio are computed in a single vectorised pass with NumPy —
    no Python loop over samples is needed.

    The response contains all sampled portfolios (without per-sample weights,
    to keep the payload small) plus the min-variance and max-Sharpe portfolios
    identified within the sample set, the current portfolio, and optional
    target portfolio — all with full weight breakdowns.
    """
    data = _load_portfolio_data(db, user_id, portfolio_id)
    symbols = data["symbols"]
    n = data["n"]
    expected_returns = data["expected_returns"]
    cov_matrix = data["cov_matrix"]
    current_weights = data["current_weights"]
    target_weights = data["target_weights"]

    # --- Vectorised Monte Carlo sampling ---
    rng = np.random.default_rng()
    # Dirichlet(1, 1, …) gives uniform samples on the weight simplex
    weights_matrix = rng.dirichlet(np.ones(n), size=num_samples)  # (S, n)

    port_returns = weights_matrix @ expected_returns                        # (S,)
    port_vols = np.sqrt(
        np.einsum("ij,jk,ik->i", weights_matrix, cov_matrix, weights_matrix)
    )                                                                        # (S,)
    port_sharpes = np.where(
        port_vols > 0,
        (port_returns - risk_free_rate) / port_vols,
        0.0,
    )                                                                        # (S,)

    # Identify special portfolios within the sample
    min_vol_idx = int(np.argmin(port_vols))
    max_sharpe_idx = int(np.argmax(port_sharpes))

    def _point(w: np.ndarray, ret: float, vol: float, sharpe: float) -> dict:
        return {
            "expected_return": round(float(ret) * 100, 4),
            "volatility": round(float(vol) * 100, 4),
            "sharpe_ratio": round(float(sharpe), 4),
            "weights": {symbols[i]: round(float(w[i]) * 100, 2) for i in range(n)},
        }

    def _current_metrics(w: np.ndarray) -> dict:
        ret = float(w @ expected_returns)
        vol = float(np.sqrt(w @ cov_matrix @ w))
        sharpe = (ret - risk_free_rate) / vol if vol > 0 else 0.0
        return _point(w, ret, vol, sharpe)

    simulated_portfolios = [
        {
            "expected_return": round(float(port_returns[i]) * 100, 4),
            "volatility": round(float(port_vols[i]) * 100, 4),
            "sharpe_ratio": round(float(port_sharpes[i]), 4),
        }
        for i in range(num_samples)
    ]

    return {
        "portfolio_id": str(portfolio_id),
        "simulated_portfolios": simulated_portfolios,
        "min_variance": _point(
            weights_matrix[min_vol_idx],
            port_returns[min_vol_idx],
            port_vols[min_vol_idx],
            port_sharpes[min_vol_idx],
        ),
        "max_sharpe": _point(
            weights_matrix[max_sharpe_idx],
            port_returns[max_sharpe_idx],
            port_vols[max_sharpe_idx],
            port_sharpes[max_sharpe_idx],
        ),
        "current_portfolio": _current_metrics(current_weights),
        "target_portfolio": _current_metrics(target_weights) if target_weights is not None else None,
        "symbols": symbols,
        "risk_free_rate": risk_free_rate,
        "num_samples": num_samples,
    }
