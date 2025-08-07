# Data Validation and Models

This document describes the data validation models used in the Portfolio Balancer API.

## Overview

The Portfolio Balancer API uses [Pydantic](https://pydantic-docs.helpmanual.io/) to enforce strict data validation for both input and output data. This ensures:

1. **Input Validation**: All user-provided data is validated against specific schemas with proper constraints.
2. **Output Validation**: All API responses follow consistent structures with properly typed fields.
3. **Error Handling**: Detailed validation errors are provided when input data doesn't meet the requirements.

## Input Models

### Portfolio Input

All portfolio data submitted to the API must follow this structure:

```json
{
  "AAPL": {
    "weight": 0.4,
    "shares": 10,
    "cost_basis": 150.0
  },
  "GOOG": {
    "weight": 0.3,
    "shares": 5,
    "cost_basis": 280.0
  },
  "AMZN": {
    "weight": 0.3,
    "shares": 8,
    "cost_basis": 120.0
  }
}
```

**Validation Rules**:

- Portfolio weights must sum to 1.0 (with a small tolerance for rounding errors)
- Each asset weight must be between 0 and 1
- Shares and cost_basis are optional but must be positive numbers if provided

### Optimization Input

Parameters for portfolio optimization:

```json
{
  "risk_aversion": 3.0
}
```

**Validation Rules**:

- `risk_aversion` must be between 0.1 and 100.0 (default: 5.0)
- No additional fields are allowed

### Rebalance Input

Parameters for portfolio rebalancing:

```json
{
  "target_allocation": {
    "AAPL": 0.3,
    "GOOG": 0.4,
    "AMZN": 0.3
  }
}
```

**Validation Rules**:

- Target allocation weights must sum to 1.0 (with a small tolerance for rounding errors)
- Each target weight must be between 0 and 1
- Target allocation is optional

## Output Models

All API responses include a `data_status` field that confirms the completion status of the operation.

### Risk Analysis Output

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
    }
  },
  "data_status": "Complete"
}
```

### Optimization Output

```json
{
  "optimization_result": {
    "optimal_allocation": {
      "AAPL": 0.35,
      "GOOG": 0.4,
      "AMZN": 0.25
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

### Efficient Frontier Output

```json
{
  "efficient_frontier": [
    {
      "risk_aversion": 30,
      "expected_return": 0.0006,
      "volatility": 0.011,
      "sharpe_ratio": 0.054,
      "weights": {
        "AAPL": 0.2,
        "GOOG": 0.5,
        "AMZN": 0.3
      }
    }
    // Additional points along the frontier...
  ],
  "data_status": "Complete"
}
```

### Risk Report Output

The Risk Report endpoint provides comprehensive data including:

1. Points along the efficient frontier
2. Special portfolios (minimum variance, maximum Sharpe ratio, current)
3. Enhanced risk metrics for each portfolio
4. Asset-level risk profiles
5. Correlation matrix

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
          "GOOG": 0.7,
          "AMZN": 0.2
        },
        "risk_metrics": {
          "var_95": -0.01645,
          "cvar_95": -0.0196,
          "max_drawdown_estimate": -0.0233
        }
      }
      // Additional points...
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
      // Risk profiles for each asset
    },
    "correlation_matrix": {
      // Correlation matrix data
    }
  },
  "data_status": "Complete"
}
```

## Error Handling

When validation fails, the API returns a 400 Bad Request error with details about the validation failure:

```json
{
  "error": "Bad Request",
  "message": "Invalid portfolio data: Portfolio weights must sum to 1.0 (current sum: 1.2000)",
  "status_code": 400
}
```
