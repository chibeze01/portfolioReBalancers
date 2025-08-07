# Portfolio API Usage Guide

This document provides examples of how to use the Portfolio Balancer API endpoints.

## Submit Portfolio Data

**Endpoint:** `POST /portfolio/submit`

**Example Request:**

```json
{
  "AAPL": {
    "weight": 0.25,
    "shares": 10,
    "cost_basis": 150.0,
    "purchase_price": 145.0,
    "purchase_date": "2023-08-15"
  },
  "MSFT": {
    "weight": 0.25,
    "shares": 5,
    "cost_basis": 300.0,
    "purchase_price": 280.0,
    "purchase_date": "2023-06-22"
  },
  "GOOG": {
    "weight": 0.2,
    "shares": 4,
    "cost_basis": 2500.0,
    "purchase_price": 2450.0,
    "purchase_date": "2023-09-10"
  },
  "AMZN": {
    "weight": 0.15,
    "shares": 8,
    "cost_basis": 120.0,
    "purchase_price": 115.0,
    "purchase_date": "2023-07-05"
  },
  "META": {
    "weight": 0.15,
    "shares": 6,
    "cost_basis": 300.0,
    "purchase_price": 290.0,
    "purchase_date": "2023-10-15"
  }
}
```

**Example Response:**

```json
{
  "message": "Portfolio data submitted and stored successfully"
}
```

## Get Risk Analysis

**Endpoint:** `GET /portfolio/risk-analysis`

**Example Response:**

```json
{
  "risk_analysis": {
    "AAPL": {
      "volatility": 0.015,
      "mean_return": 0.001,
      "var_95": -0.025,
      "max_drawdown": -0.03,
      "sharpe_ratio": 0.067,
      "risk_category": "Medium"
    },
    "MSFT": {
      "volatility": 0.012,
      "mean_return": 0.0008,
      "var_95": -0.018,
      "max_drawdown": -0.025,
      "sharpe_ratio": 0.067,
      "risk_category": "Medium"
    },
    "GOOG": {
      "volatility": 0.018,
      "mean_return": 0.0011,
      "var_95": -0.03,
      "max_drawdown": -0.04,
      "sharpe_ratio": 0.061,
      "risk_category": "Medium"
    },
    "AMZN": {
      "volatility": 0.022,
      "mean_return": 0.0012,
      "var_95": -0.035,
      "max_drawdown": -0.05,
      "sharpe_ratio": 0.055,
      "risk_category": "High"
    },
    "META": {
      "volatility": 0.025,
      "mean_return": 0.0015,
      "var_95": -0.04,
      "max_drawdown": -0.06,
      "sharpe_ratio": 0.06,
      "risk_category": "High"
    }
  },
  "data_status": "Complete"
}
```

## Get Covariance Matrix

**Endpoint:** `GET /portfolio/covariance-matrix`

**Example Response (abbreviated):**

```json
{
  "covariance_matrix": {
    "AAPL": {
      "AAPL": 0.000225,
      "MSFT": 0.00015,
      "GOOG": 0.00012,
      "AMZN": 0.0001,
      "META": 0.00009
    },
    "MSFT": {
      "AAPL": 0.00015,
      "MSFT": 0.000144,
      "GOOG": 0.00011,
      "AMZN": 0.00009,
      "META": 0.00008
    }
    // ... other values
  },
  "data_status": "Complete"
}
```

## Get Portfolio Risk Score

**Endpoint:** `GET /portfolio/risk-score`

**Example Response:**

```json
{
  "portfolio_risk_score": {
    "risk_value": 0.016,
    "risk_category": "Medium",
    "sharpe_ratio": 0.064,
    "expected_return": 0.00103
  },
  "data_status": "Complete"
}
```

## Rebalance Portfolio

**Endpoint:** `POST /portfolio/rebalance`

**Example Request (optional - with target allocation):**

```json
{
  "target_allocation": {
    "AAPL": 0.3,
    "MSFT": 0.3,
    "GOOG": 0.2,
    "AMZN": 0.1,
    "META": 0.1
  }
}
```

**Example Response:**

```json
{
  "rebalancing_suggestion": {
    "AAPL": {
      "current_weight": 0.25,
      "target_weight": 0.3,
      "change": 0.05
    },
    "MSFT": {
      "current_weight": 0.25,
      "target_weight": 0.3,
      "change": 0.05
    },
    "GOOG": {
      "current_weight": 0.2,
      "target_weight": 0.2,
      "change": 0
    },
    "AMZN": {
      "current_weight": 0.15,
      "target_weight": 0.1,
      "change": -0.05
    },
    "META": {
      "current_weight": 0.15,
      "target_weight": 0.1,
      "change": -0.05
    }
  },
  "data_status": "Complete"
}
```

**Example Response (without target allocation):**

```json
{
  "rebalancing_suggestion": {
    "AAPL": {
      "current_weight": 0.25,
      "suggested_weight": 0.25,
      "change": 0,
      "reason": "Based on medium risk profile"
    },
    "MSFT": {
      "current_weight": 0.25,
      "suggested_weight": 0.25,
      "change": 0,
      "reason": "Based on medium risk profile"
    },
    "GOOG": {
      "current_weight": 0.2,
      "suggested_weight": 0.2,
      "change": 0,
      "reason": "Based on medium risk profile"
    },
    "AMZN": {
      "current_weight": 0.15,
      "suggested_weight": 0.1,
      "change": -0.05,
      "reason": "Based on high risk profile"
    },
    "META": {
      "current_weight": 0.15,
      "suggested_weight": 0.1,
      "change": -0.05,
      "reason": "Based on high risk profile"
    }
  },
  "data_status": "Complete"
}
```

## Portfolio Optimization

**Endpoint:** `POST /portfolio/optimize`

The optimize endpoint uses Modern Portfolio Theory (MPT) to find the optimal allocation of assets that maximizes expected return for a given level of risk.

**Example Request:**

```json
{
  "risk_aversion": 3.0
}
```

**Example Response:**

```json
{
  "optimization_result": {
    "optimal_allocation": {
      "AAPL": 0.35,
      "MSFT": 0.4,
      "GOOG": 0.15,
      "AMZN": 0.05,
      "META": 0.05
    },
    "portfolio_metrics": {
      "expected_return": 0.00092,
      "volatility": 0.014,
      "sharpe_ratio": 0.066
    },
    "optimization_info": {
      "risk_aversion": 3.0,
      "convergence": true,
      "iterations": 12
    }
  },
  "data_status": "Complete"
}
```

The `risk_aversion` parameter (default: 5.0) controls the trade-off between return and risk:

- Lower values (e.g., 1-3): Prioritize returns, accept higher risk
- Medium values (e.g., 4-7): Balanced approach
- Higher values (e.g., 8+): Prioritize risk reduction, accept lower returns

## Efficient Frontier

**Endpoint:** `GET /portfolio/efficient-frontier`

This endpoint generates the efficient frontier by calculating multiple optimized portfolios at different risk levels.

**Example Response (abbreviated):**

```json
{
  "efficient_frontier": [
    {
      "risk_aversion": 30,
      "expected_return": 0.0006,
      "volatility": 0.011,
      "sharpe_ratio": 0.054,
      "weights": {
        "AAPL": 0.1,
        "MSFT": 0.6,
        "GOOG": 0.2,
        "AMZN": 0.05,
        "META": 0.05
      }
    },
    {
      "risk_aversion": 20,
      "expected_return": 0.0007,
      "volatility": 0.012,
      "sharpe_ratio": 0.058,
      "weights": {
        "AAPL": 0.15,
        "MSFT": 0.55,
        "GOOG": 0.2,
        "AMZN": 0.05,
        "META": 0.05
      }
    }
    // ... more points along the frontier
  ],
  "data_status": "Complete"
}
```

## Risk Report

**Endpoint:** `GET /portfolio/risk-report`

This endpoint provides comprehensive portfolio risk analysis data for visualization, including the efficient frontier, key portfolio comparison points, risk metrics, and asset correlations.

**Example Response (abbreviated):**

```json
{
  "risk_report": {
    "efficient_frontier": [
      {
        "type": "min_variance",
        "expected_return": 0.0005,
        "volatility": 0.01,
        "sharpe_ratio": 0.05,
        "weights": {
          "AAPL": 0.1,
          "MSFT": 0.7,
          "GOOG": 0.15,
          "AMZN": 0.03,
          "META": 0.02
        },
        "risk_metrics": {
          "var_95": -0.01645,
          "cvar_95": -0.0196,
          "max_drawdown_estimate": -0.0233
        }
      },
      {
        "type": "max_sharpe",
        "expected_return": 0.001,
        "volatility": 0.015,
        "sharpe_ratio": 0.067,
        "weights": {
          "AAPL": 0.4,
          "MSFT": 0.3,
          "GOOG": 0.2,
          "AMZN": 0.05,
          "META": 0.05
        },
        "risk_metrics": {
          "var_95": -0.024675,
          "cvar_95": -0.0294,
          "max_drawdown_estimate": -0.03495
        }
      },
      {
        "type": "current_portfolio",
        "expected_return": 0.0008,
        "volatility": 0.014,
        "sharpe_ratio": 0.057,
        "weights": {
          "AAPL": 0.25,
          "MSFT": 0.25,
          "GOOG": 0.2,
          "AMZN": 0.15,
          "META": 0.15
        },
        "risk_metrics": {
          "var_95": -0.02303,
          "cvar_95": -0.02744,
          "max_drawdown_estimate": -0.03262
        }
      }
      // ... more efficient frontier points
    ],
    "portfolio_summary": {
      "current": {
        "expected_return": 0.0008,
        "volatility": 0.014,
        "sharpe_ratio": 0.057
      },
      "min_variance": {
        "expected_return": 0.0005,
        "volatility": 0.01,
        "sharpe_ratio": 0.05
      },
      "max_sharpe": {
        "expected_return": 0.001,
        "volatility": 0.015,
        "sharpe_ratio": 0.067
      }
    },
    "asset_risk_profiles": {
      "AAPL": {
        "volatility": 0.015,
        "mean_return": 0.001,
        "var_95": -0.025,
        "max_drawdown": -0.03,
        "sharpe_ratio": 0.067,
        "risk_category": "Medium"
      }
      // ... other assets
    },
    "correlation_matrix": {
      "AAPL": {
        "AAPL": 1.0,
        "MSFT": 0.7,
        "GOOG": 0.6,
        "AMZN": 0.5,
        "META": 0.4
      }
      // ... other correlations
    }
  },
  "data_status": "Complete"
}
```

The risk report provides:

- Efficient frontier with key portfolios (min variance, max Sharpe ratio, current)
- Additional risk metrics for each portfolio (VaR, CVaR, max drawdown estimates)
- Portfolio summary comparing current vs. optimal portfolios
- Individual asset risk profiles
- Correlation matrix showing relationships between assets

This endpoint is designed for generating comprehensive risk visualization dashboards.
