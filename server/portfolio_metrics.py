"""
Portfolio Metrics and Risk Analysis Utilities
===========================================

This module provides utility functions for pulling financial
time‑series data and computing a variety of performance and risk
metrics for individual securities and portfolios.  The functions
implemented here are designed to integrate with the Pydantic data
models supplied in the surrounding API (see the provided models in
the task description) but can also be used standalone.  All of
the metrics are calculated from historical price data and, when
appropriate, incorporate the risk‑free rate and a benchmark index.

Key metrics implemented include:

* **Mean Return & Volatility** — Mean of periodic returns and their
  standard deviation.  Volatility is calculated on the same
  periodicity as the input return series.
* **Sharpe Ratio** — A measure of risk‑adjusted performance defined
  as the excess return (above the risk‑free rate) divided by
  volatility【747476313601965†L272-L278】.
* **Beta & Alpha** — Systematic risk (beta) computed as the
  covariance of asset returns with benchmark returns divided by
  benchmark variance【961297374598117†L317-L324】.  Alpha is the excess
  return above what CAPM predicts for a given beta【961297374598117†L317-L324】.
* **Treynor Ratio** — Risk‑adjusted return using beta in the
  denominator【197146940317466†L258-L265】.
* **Value at Risk (VaR) & Conditional VaR (CVaR)** — Estimates of the
  maximum expected loss at a given confidence level and the expected
  loss beyond that threshold【691547244381412†L255-L290】【694746442080820†L250-L283】.
* **Maximum Drawdown** — The largest peak‑to‑trough decline in
  cumulative returns【564130218818573†L274-L284】.

In addition to per‑asset metrics, portfolio‑level functions compute
expected return, volatility, Sharpe ratio, beta and covariance
matrices given asset weights.  The module also includes utility
functions for aggregating purchase histories (multiple buy lots) to
derive total positions and profit/loss figures.

The code uses the `yfinance` library to download price data from
Yahoo! Finance.  If `yfinance` is not installed, install it via
`pip install yfinance`.  The functions return data in common
Python/Pandas structures for easy consumption in a dashboard or
further analysis.
"""

from __future__ import annotations

import math
from typing import Dict, List, Optional, Tuple, Iterable
from models import RiskMetrics, PortfolioMetrics, CovarianceOutput, AssetPosition
import numpy as np
import pandas as pd

# Note: yfinance is only required when fetching price data.  To allow
# the remainder of this module to be imported without yfinance
# installed (for example during testing with synthetic data), we
# postpone importing yfinance until it is actually needed in
# ``fetch_price_data``.  This avoids raising ImportError during
# import of the module when the user is not calling the data
# download function.
try:
    import yfinance  # type: ignore
except ImportError:
    yfinance = None  # type: ignore


# -----------------------------------------------------------------------------
# Helper functions to construct data models from computed metrics
# -----------------------------------------------------------------------------

def build_risk_metrics(
    returns: pd.Series,
    benchmark_returns: Optional[pd.Series] = None,
    risk_free_rate: float = 0.0,
    confidence_level: float = 0.95,
    purchase_price: Optional[float] = None,
    purchase_date: Optional[str] = None,
    current_price: Optional[float] = None,
    total_return_pct: Optional[float] = None,
) -> RiskMetrics:
    """Compute and assemble a ``RiskMetrics`` object from a return series.

    This is a convenience wrapper around :func:`compute_asset_risk_metrics`.  It
    calculates the standard suite of risk statistics and populates the
    corresponding Pydantic model, including optional purchase information.

    Parameters
    ----------
    returns : pd.Series
        Series of asset returns.
    benchmark_returns : pd.Series, optional
        Series of benchmark returns used to compute beta and alpha.  Beta
        and alpha are not included in the ``RiskMetrics`` output but are
        required for the Sharpe ratio calculation.  When provided, the
        underlying mean and volatility computations will align the two
        series.
    risk_free_rate : float, optional
        Risk‑free rate per period.  Defaults to 0.0.
    confidence_level : float, optional
        Confidence level for VaR and CVaR.  Defaults to 0.95.
    purchase_price, purchase_date, current_price, total_return_pct : optional
        Additional fields used to populate the optional attributes of
        ``RiskMetrics``.

    Returns
    -------
    RiskMetrics
        A fully populated ``RiskMetrics`` instance.
    """
    # Use existing utility to compute dictionary of metrics
    metrics = compute_asset_risk_metrics(
        returns=returns,
        benchmark_returns=benchmark_returns,
        risk_free_rate=risk_free_rate,
        confidence_level=confidence_level,
    )
    # Map the keys to the Pydantic model fields.  The compute function returns
    # 'mean_return', 'volatility', 'sharpe_ratio', 'var', 'cvar',
    # 'max_drawdown' and 'risk_category'.  For the model, we use
    # VaR at the 95% level as `var_95`.
    return RiskMetrics(
        volatility=metrics['volatility'] if not math.isnan(metrics['volatility']) else 0.0,
        mean_return=metrics['mean_return'],
        var_95=metrics['var'],
        max_drawdown=metrics['max_drawdown'],
        sharpe_ratio=metrics['sharpe_ratio'],
        risk_category=metrics['risk_category'],
        purchase_price=purchase_price,
        purchase_date=purchase_date,
        current_price=current_price,
        total_return_pct=total_return_pct,
    )


def build_portfolio_metrics(
    weights: Dict[str, float],
    returns: pd.DataFrame,
    benchmark_returns: Optional[pd.Series] = None,
    risk_free_rate: float = 0.0,
    confidence_level: float = 0.95,
) -> PortfolioMetrics:
    """Compute and assemble a ``PortfolioMetrics`` object from asset returns.

    This wrapper calls :func:`compute_portfolio_metrics` to obtain
    portfolio‑level metrics and converts the result into a Pydantic model.

    Parameters
    ----------
    weights : dict
        Mapping from ticker to portfolio weight.  Should sum to approximately 1.
    returns : pd.DataFrame
        DataFrame of asset returns indexed by date.
    benchmark_returns : pd.Series, optional
        Benchmark return series for computing portfolio beta and alpha.
    risk_free_rate : float, optional
        Risk‑free rate per period.  Defaults to 0.0.
    confidence_level : float, optional
        Confidence level for VaR and CVaR.  Not used in the model but
        passed through to the underlying computation for completeness.

    Returns
    -------
    PortfolioMetrics
        A model instance containing expected return, volatility and
        Sharpe ratio.
    """
    metrics = compute_portfolio_metrics(
        weights=weights,
        returns=returns,
        benchmark_returns=benchmark_returns,
        risk_free_rate=risk_free_rate,
        confidence_level=confidence_level,
    )
    return PortfolioMetrics(
        expected_return=metrics['expected_return'],
        volatility=metrics['volatility'],
        sharpe_ratio=metrics['sharpe_ratio'],
    )


def build_covariance_output(returns: pd.DataFrame) -> CovarianceOutput:
    """Construct a ``CovarianceOutput`` model from a DataFrame of returns.

    The covariance matrix is computed using pandas' built‑in ``cov`` method
    and then converted to nested dictionaries for JSON serialization.  The
    resulting model includes a ``data_status`` field set to 'Complete' to
    match the expected API structure.

    Parameters
    ----------
    returns : pd.DataFrame
        DataFrame of returns.

    Returns
    -------
    CovarianceOutput
        Model containing the covariance matrix and status.
    """
    cov_df = compute_covariance_matrix(returns)
    # Convert DataFrame to nested dict (outer and inner keys are strings)
    cov_dict: Dict[str, Dict[str, float]] = {
        row: {col: float(cov_df.at[row, col]) for col in cov_df.columns}
        for row in cov_df.index
    }
    return CovarianceOutput(covariance_matrix=cov_dict)


def fetch_price_data(
    tickers: Iterable[str],
    start: Optional[str] = None,
    end: Optional[str] = None,
    interval: str = "1d",
) -> pd.DataFrame:
    """Download adjusted close price data for the given tickers.

    Parameters
    ----------
    tickers : iterable of str
        List or set of ticker symbols to download (e.g. ['AAPL', 'MSFT']).
    start : str, optional
        Start date (YYYY‑MM‑DD).  If None, defaults to earliest available.
    end : str, optional
        End date (YYYY‑MM‑DD).  If None, defaults to today.
    interval : str, optional
        Data interval ('1d', '1wk', '1mo', etc.).  Daily data is
        recommended for risk calculations.

    Returns
    -------
    pd.DataFrame
        DataFrame of adjusted closing prices indexed by date and with a
        column for each ticker.
    """
    tickers_list = list(tickers)
    # Lazy import of yfinance: only import when this function is called.
    if yfinance is None:
        raise ImportError(
            "The yfinance package is required for data download. "
            "Install it via 'pip install yfinance' before using this function."
        )
    data = yfinance.download(
        tickers=tickers_list,
        start=start,
        end=end,
        interval=interval,
        auto_adjust=False,
        progress=False,
    )
    # `data` returned by yfinance has a column MultiIndex if multiple
    # tickers are requested.  Select only the 'Adj Close' portion and
    # flatten the columns if necessary.
    if isinstance(data.columns, pd.MultiIndex):
        # Select level 0 'Adj Close'
        adj = data['Adj Close']
    else:
        # Single ticker case: use DataFrame directly
        adj = data.rename(columns={c: c for c in data.columns})
    # Drop rows with all NaNs
    adj = adj.dropna(how="all")
    return adj


def compute_returns(prices: pd.DataFrame, freq: str = "D") -> pd.DataFrame:
    """Compute percentage returns from a price DataFrame.

    Returns are calculated using the pandas `pct_change` method and
    missing values are dropped.  The frequency parameter `freq` is
    retained for potential resampling (e.g. monthly returns).  If
    resampling is desired, the caller can resample the price data prior
    to calling this function.

    Parameters
    ----------
    prices : pd.DataFrame
        DataFrame of prices indexed by date.
    freq : str, optional
        Label describing the periodicity of the returns (e.g. 'D' for
        daily, 'M' for monthly).  This value is not currently used
        internally but can be stored alongside the output.

    Returns
    -------
    pd.DataFrame
        DataFrame of returns, with the same columns as `prices` and
        index shifted to reflect the period between observations.
    """
    returns = prices.pct_change().dropna(how="all")
    return returns


def calculate_beta(stock_returns: pd.Series, benchmark_returns: pd.Series) -> float:
    """Calculate beta for a single asset relative to a benchmark.

    Beta measures the sensitivity of the asset's returns to movements
    in the benchmark and is defined as the covariance of the asset
    returns with the benchmark divided by the variance of the
    benchmark returns【961297374598117†L317-L324】.

    Parameters
    ----------
    stock_returns : pd.Series
        Series of periodic returns for the asset.
    benchmark_returns : pd.Series
        Series of periodic returns for the benchmark (must align with
        stock_returns index).

    Returns
    -------
    float
        The beta of the asset.  NaN is returned if variance of the
        benchmark is zero or if inputs are insufficient.
    """
    if stock_returns.empty or benchmark_returns.empty:
        return float('nan')
    # Align the series
    aligned = pd.concat([stock_returns, benchmark_returns], axis=1).dropna()
    if aligned.shape[0] < 2:
        return float('nan')
    cov_matrix = np.cov(aligned.iloc[:, 0], aligned.iloc[:, 1])
    covariance = cov_matrix[0, 1]
    benchmark_variance = cov_matrix[1, 1]
    if benchmark_variance == 0:
        return float('nan')
    return covariance / benchmark_variance


def calculate_alpha(
    stock_returns: pd.Series,
    benchmark_returns: pd.Series,
    beta: float,
    risk_free_rate: float = 0.0,
) -> float:
    """Calculate Jensen's alpha for a single asset.

    Alpha is the excess return of the asset relative to what would be
    predicted by the Capital Asset Pricing Model (CAPM).  It is
    computed as::

        alpha = (R_asset - R_f) - beta * (R_benchmark - R_f)

    where ``R_asset`` and ``R_benchmark`` are the mean returns of the
    asset and benchmark respectively and ``R_f`` is the risk‑free rate
    【961297374598117†L317-L324】.  Positive alpha indicates outperformance
    relative to the expected CAPM return.

    Parameters
    ----------
    stock_returns : pd.Series
        Series of asset returns.
    benchmark_returns : pd.Series
        Series of benchmark returns.
    beta : float
        Beta of the asset relative to the benchmark.
    risk_free_rate : float, optional
        Risk‑free rate used in the calculation (per period).  Defaults to 0.

    Returns
    -------
    float
        The Jensen's alpha of the asset.
    """
    if stock_returns.empty or benchmark_returns.empty or math.isnan(beta):
        return float('nan')
    mean_asset = stock_returns.mean()
    mean_benchmark = benchmark_returns.mean()
    alpha = (mean_asset - risk_free_rate) - beta * (mean_benchmark - risk_free_rate)
    return alpha


def calculate_sharpe_ratio(
    asset_returns: pd.Series,
    risk_free_rate: float = 0.0,
) -> float:
    """Compute the Sharpe ratio for a return series.

    The Sharpe ratio compares the excess return of an investment over
    the risk‑free rate to its return volatility【747476313601965†L272-L278】.  A
    higher Sharpe ratio indicates better risk‑adjusted performance.  If
    the standard deviation of returns is zero, NaN is returned.

    Parameters
    ----------
    asset_returns : pd.Series
        Return series for the asset.
    risk_free_rate : float, optional
        Risk‑free rate per period.  Defaults to 0.

    Returns
    -------
    float
        The Sharpe ratio.
    """
    if asset_returns.empty:
        return float('nan')
    excess_returns = asset_returns - risk_free_rate
    std_dev = asset_returns.std(ddof=0)
    if std_dev == 0:
        return float('nan')
    return excess_returns.mean() / std_dev


def calculate_treynor_ratio(
    asset_returns: pd.Series,
    beta: float,
    risk_free_rate: float = 0.0,
) -> float:
    """Compute the Treynor ratio for a return series.

    The Treynor ratio measures excess return per unit of systematic
    risk (beta)【197146940317466†L258-L265】.  It is defined as::

        Treynor = (mean(asset_returns) - risk_free_rate) / beta

    The ratio is undefined when beta is zero or NaN.

    Parameters
    ----------
    asset_returns : pd.Series
        Series of periodic returns for the asset.
    beta : float
        Beta of the asset relative to the benchmark.
    risk_free_rate : float, optional
        Risk‑free rate per period.  Defaults to 0.

    Returns
    -------
    float
        The Treynor ratio.
    """
    if asset_returns.empty or beta == 0 or math.isnan(beta):
        return float('nan')
    mean_ret = asset_returns.mean()
    return (mean_ret - risk_free_rate) / beta


def calculate_var(
    returns: pd.Series,
    confidence_level: float = 0.95,
) -> float:
    """Compute the Value at Risk (VaR) of a return series.

    VaR represents the maximum expected loss over a period at a given
    confidence level【691547244381412†L255-L290】.  This implementation uses the
    historical percentile method.  For example, with a 95% confidence
    level, the 5th percentile of the distribution of returns is
    selected.  The result is returned as a negative number (i.e. a
    loss).

    Parameters
    ----------
    returns : pd.Series
        Series of periodic returns.
    confidence_level : float, optional
        Confidence level (between 0 and 1).  Defaults to 0.95.

    Returns
    -------
    float
        The Value at Risk (negative value) representing the maximum
        expected loss.
    """
    if returns.empty:
        return float('nan')
    # Compute percentile threshold
    percentile = 100 * (1 - confidence_level)
    var_value = np.percentile(returns, percentile)
    return float(var_value)


def calculate_cvar(
    returns: pd.Series,
    var_value: Optional[float] = None,
    confidence_level: float = 0.95,
) -> float:
    """Compute the Conditional Value at Risk (CVaR) of a return series.

    CVaR, or expected shortfall, is the average of losses that exceed
    the VaR threshold【694746442080820†L250-L283】.  It quantifies tail risk by
    taking the mean of the worst (1 - confidence_level) fraction of
    returns.  If `var_value` is provided, it is used as the cutoff;
    otherwise, it is computed from the data.

    Parameters
    ----------
    returns : pd.Series
        Series of periodic returns.
    var_value : float, optional
        Precomputed VaR threshold.  If None, VaR is computed using the
        same confidence level.
    confidence_level : float, optional
        Confidence level used to determine the tail fraction.  Defaults
        to 0.95.

    Returns
    -------
    float
        The Conditional Value at Risk (negative value).
    """
    if returns.empty:
        return float('nan')
    if var_value is None:
        var_value = calculate_var(returns, confidence_level)
    # Identify tail losses (returns less than or equal to VaR)
    tail_losses = returns[returns <= var_value]
    if tail_losses.empty:
        return float('nan')
    return float(tail_losses.mean())


def calculate_max_drawdown(returns: pd.Series) -> float:
    """Compute the maximum drawdown from a return series.

    Maximum drawdown represents the largest peak‑to‑trough decline
    observed in cumulative returns【564130218818573†L274-L284】.  It is computed
    by constructing a cumulative growth series, tracking its running
    maximum, and measuring the minimum relative decline from that
    running maximum.  The result is a negative number.

    Parameters
    ----------
    returns : pd.Series
        Series of periodic returns.

    Returns
    -------
    float
        Maximum drawdown expressed as a fraction (negative).  For
        example, -0.2 corresponds to a 20% peak‑to‑trough decline.
    """
    if returns.empty:
        return float('nan')
    # Compute cumulative growth (1 + r) cumulative product
    cumulative = (1 + returns).cumprod()
    running_max = cumulative.cummax()
    drawdowns = (cumulative - running_max) / running_max
    return float(drawdowns.min())


def categorize_risk(volatility: float, thresholds: Tuple[float, float] = (0.10, 0.20)) -> str:
    """Classify volatility into a categorical risk bucket.

    The default thresholds divide annualized volatility into three
    categories: low (<10%), medium (10–20%) and high (>20%).  These
    thresholds can be adjusted depending on the investor’s tolerance or
    asset class.  Volatility should be provided on an annualized basis
    (e.g. daily volatility multiplied by sqrt(252)).

    Parameters
    ----------
    volatility : float
        Annualized volatility (standard deviation of returns).  Should
        be non‑negative.
    thresholds : tuple of two floats, optional
        Lower and upper threshold for medium risk.  Defaults to
        (0.10, 0.20) representing 10% and 20% annualized volatility.

    Returns
    -------
    str
        One of 'Low', 'Medium', or 'High'.
    """
    low_thresh, high_thresh = thresholds
    if math.isnan(volatility):
        return "Unknown"
    if volatility < low_thresh:
        return "Low"
    elif volatility < high_thresh:
        return "Medium"
    else:
        return "High"


def compute_asset_risk_metrics(
    returns: pd.Series,
    benchmark_returns: Optional[pd.Series] = None,
    risk_free_rate: float = 0.0,
    confidence_level: float = 0.95,
) -> Dict[str, float]:
    """Compute a suite of risk metrics for a single asset.

    Parameters
    ----------
    returns : pd.Series
        Series of asset returns.
    benchmark_returns : pd.Series, optional
        Benchmark return series used for beta, alpha and Treynor ratio.
        If None, those metrics will be set to NaN.
    risk_free_rate : float, optional
        Risk‑free rate per period for risk‑adjusted measures.
    confidence_level : float, optional
        Confidence level for VaR and CVaR calculations.

    Returns
    -------
    dict
        Dictionary with keys: 'mean_return', 'volatility',
        'sharpe_ratio', 'beta', 'alpha', 'treynor_ratio', 'var',
        'cvar', 'max_drawdown' and 'risk_category'.
    """
    metrics: Dict[str, float] = {}
    if returns.empty:
        # Populate NaNs for each metric
        keys = [
            'mean_return', 'volatility', 'sharpe_ratio', 'beta', 'alpha',
            'treynor_ratio', 'var', 'cvar', 'max_drawdown', 'risk_category'
        ]
        return {k: float('nan') for k in keys}
    # Mean and volatility (standard deviation)
    mean_ret = returns.mean()
    vol = returns.std(ddof=0)
    # Sharpe ratio
    sharpe = calculate_sharpe_ratio(returns, risk_free_rate)
    # Beta and alpha require benchmark returns
    if benchmark_returns is not None and not benchmark_returns.empty:
        beta = calculate_beta(returns, benchmark_returns)
        alpha = calculate_alpha(returns, benchmark_returns, beta, risk_free_rate)
        treynor = calculate_treynor_ratio(returns, beta, risk_free_rate)
    else:
        beta = float('nan')
        alpha = float('nan')
        treynor = float('nan')
    # VaR and CVaR
    var_value = calculate_var(returns, confidence_level)
    cvar_value = calculate_cvar(returns, var_value, confidence_level)
    # Maximum drawdown
    mdd = calculate_max_drawdown(returns)
    # Risk category (annualize volatility assuming 252 trading days)
    annualized_vol = vol * math.sqrt(252)
    risk_cat = categorize_risk(annualized_vol)
    metrics.update(
        mean_return=float(mean_ret),
        volatility=float(vol),
        sharpe_ratio=float(sharpe) if sharpe is not None else float('nan'),
        beta=float(beta) if beta is not None else float('nan'),
        alpha=float(alpha) if alpha is not None else float('nan'),
        treynor_ratio=float(treynor) if treynor is not None else float('nan'),
        var=float(var_value) if var_value is not None else float('nan'),
        cvar=float(cvar_value) if cvar_value is not None else float('nan'),
        max_drawdown=float(mdd) if mdd is not None else float('nan'),
        risk_category=risk_cat,
    )
    return metrics


def compute_portfolio_metrics(
    weights: Dict[str, float],
    returns: pd.DataFrame,
    benchmark_returns: Optional[pd.Series] = None,
    risk_free_rate: float = 0.0,
    confidence_level: float = 0.95,
) -> Dict[str, float]:
    """Compute portfolio‑level performance and risk metrics.

    The portfolio return at each period is the weighted sum of the
    individual asset returns.  Portfolio volatility is calculated
    using the covariance matrix of asset returns and the weight vector.
    Beta and alpha are computed relative to a benchmark return series
    if provided.  VaR, CVaR and maximum drawdown are calculated on
    the portfolio return series.

    Parameters
    ----------
    weights : dict
        Mapping from ticker to portfolio weight.  Should sum to ~1.
    returns : pd.DataFrame
        DataFrame of asset returns aligned by date; columns must
        correspond to keys in `weights`.
    benchmark_returns : pd.Series, optional
        Benchmark return series used for portfolio beta and alpha.
    risk_free_rate : float, optional
        Risk‑free rate per period for risk‑adjusted measures.
    confidence_level : float, optional
        Confidence level for VaR and CVaR.

    Returns
    -------
    dict
        Dictionary with keys: 'expected_return', 'volatility',
        'sharpe_ratio', 'beta', 'alpha', 'treynor_ratio', 'var',
        'cvar', 'max_drawdown', 'risk_category'.
    """
    # Ensure the returns DataFrame contains only the assets specified in weights
    tickers = list(weights.keys())
    missing = [t for t in tickers if t not in returns.columns]
    if missing:
        raise KeyError(f"Return data is missing for tickers: {missing}")
    # Construct weight vector in the same order as returns columns
    w = np.array([weights[t] for t in tickers])
    # Align returns to have only the tickers of interest
    sub_returns = returns[tickers].dropna(how="any")
    if sub_returns.empty:
        # If there's no overlapping data, return NaNs
        keys = [
            'expected_return', 'volatility', 'sharpe_ratio', 'beta', 'alpha',
            'treynor_ratio', 'var', 'cvar', 'max_drawdown', 'risk_category'
        ]
        return {k: float('nan') for k in keys}
    # Compute portfolio return series
    port_ret_series = (sub_returns * w).sum(axis=1)
    # Expected return and volatility
    mean_port_ret = port_ret_series.mean()
    vol_port = port_ret_series.std(ddof=0)
    # Sharpe ratio
    sharpe_port = calculate_sharpe_ratio(port_ret_series, risk_free_rate)
    # Beta, alpha and Treynor ratio relative to benchmark
    if benchmark_returns is not None and not benchmark_returns.empty:
        # Align benchmark with portfolio returns
        aligned = pd.concat([port_ret_series, benchmark_returns], axis=1).dropna()
        if aligned.shape[0] < 2:
            beta_port = float('nan')
            alpha_port = float('nan')
            treynor_port = float('nan')
        else:
            cov = np.cov(aligned.iloc[:, 0], aligned.iloc[:, 1])
            benchmark_var = cov[1, 1]
            beta_port = cov[0, 1] / benchmark_var if benchmark_var != 0 else float('nan')
            alpha_port = (aligned.iloc[:, 0].mean() - risk_free_rate) - beta_port * (
                aligned.iloc[:, 1].mean() - risk_free_rate
            )
            treynor_port = (
                (aligned.iloc[:, 0].mean() - risk_free_rate) / beta_port
                if beta_port not in [0.0, float('nan')]
                else float('nan')
            )
    else:
        beta_port = float('nan')
        alpha_port = float('nan')
        treynor_port = float('nan')
    # VaR, CVaR and maximum drawdown on portfolio returns
    port_var = calculate_var(port_ret_series, confidence_level)
    port_cvar = calculate_cvar(port_ret_series, port_var, confidence_level)
    port_mdd = calculate_max_drawdown(port_ret_series)
    # Risk category based on annualized volatility
    annualized_vol = vol_port * math.sqrt(252)
    risk_cat = categorize_risk(annualized_vol)
    return {
        'expected_return': float(mean_port_ret),
        'volatility': float(vol_port),
        'sharpe_ratio': float(sharpe_port) if sharpe_port is not None else float('nan'),
        'beta': float(beta_port) if beta_port is not None else float('nan'),
        'alpha': float(alpha_port) if alpha_port is not None else float('nan'),
        'treynor_ratio': float(treynor_port) if treynor_port is not None else float('nan'),
        'var': float(port_var) if port_var is not None else float('nan'),
        'cvar': float(port_cvar) if port_cvar is not None else float('nan'),
        'max_drawdown': float(port_mdd) if port_mdd is not None else float('nan'),
        'risk_category': risk_cat,
    }


def aggregate_purchase_metrics(
    position: AssetPosition,
    current_price: float,
) -> Dict[str, float]:
    """Compute aggregated metrics for a position with multiple purchases.

    This helper function calculates the total number of shares held,
    average cost basis, total amount invested, current market value,
    unrealized profit/loss (P&L) and total return percentage based on
    the weighted average purchase price.

    Parameters
    ----------
    position : AssetPosition
        The asset position containing purchase history.
    current_price : float
        Latest market price of the asset (per share).

    Returns
    -------
    dict
        Dictionary with keys: 'total_shares', 'average_cost', 'total_invested',
        'current_value', 'unrealized_pl', 'total_return_pct'.
    """
    total_shares = position.total_shares()
    avg_cost = position.average_cost()
    total_invested = position.total_invested()
    current_value = total_shares * current_price
    unrealized_pl = current_value - total_invested
    total_return_pct = (current_price / avg_cost - 1.0) if avg_cost > 0 else float('nan')
    return {
        'total_shares': float(total_shares),
        'average_cost': float(avg_cost),
        'total_invested': float(total_invested),
        'current_value': float(current_value),
        'unrealized_pl': float(unrealized_pl),
        'total_return_pct': float(total_return_pct),
    }


def compute_covariance_matrix(returns: pd.DataFrame) -> pd.DataFrame:
    """Compute the covariance matrix of a DataFrame of returns.

    Returns a DataFrame where rows and columns correspond to the
    ticker symbols from the input.  Covariances are computed using
    pandas' ``cov`` function.

    Parameters
    ----------
    returns : pd.DataFrame
        DataFrame of returns.

    Returns
    -------
    pd.DataFrame
        Covariance matrix indexed and columned by tickers.
    """
    return returns.cov()


def compute_correlation_matrix(returns: pd.DataFrame) -> pd.DataFrame:
    """Compute the correlation matrix of a DataFrame of returns."""
    return returns.corr()


__all__ = [
    'fetch_price_data',
    'compute_returns',
    'calculate_beta',
    'calculate_alpha',
    'calculate_sharpe_ratio',
    'calculate_treynor_ratio',
    'calculate_var',
    'calculate_cvar',
    'calculate_max_drawdown',
    'categorize_risk',
    'compute_asset_risk_metrics',
    'compute_portfolio_metrics',
    'aggregate_purchase_metrics',
    'compute_covariance_matrix',
    'compute_correlation_matrix',
]