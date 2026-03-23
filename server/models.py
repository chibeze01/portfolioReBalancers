
from pydantic import BaseModel, Field, field_validator, model_validator, RootModel
from typing import Dict, List, Optional, Union, Any, Literal
import numpy as np
import pandas as pd
from datetime import datetime


# -----------------------------------------------------------------------------
# PurchaseEntry model
# -----------------------------------------------------------------------------

class PurchaseEntry(BaseModel):
    """Pydantic model representing a single purchase lot of an asset.

    Each entry records a specific number of shares purchased at a given
    price on a particular date.  The ``purchase_date`` is optional to
    accommodate situations where the exact date is not recorded, but
    when provided must follow the ``YYYY-MM-DD`` format.
    """

    shares: float = Field(..., gt=0.0, description="Number of shares purchased")
    purchase_price: float = Field(..., gt=0.0, description="Price paid per share")
    purchase_date: Optional[str] = Field(
        None,
        description="ISO date (YYYY-MM-DD) of purchase; optional for calculations",
        validate_default=True,
    )

    @field_validator("purchase_date")
    def validate_date_format(cls, v: Optional[str]) -> Optional[str]:
        # Accept None or a valid date string in YYYY-MM-DD format
        if v is None or v == "":
            return v
        try:
            pd.to_datetime(v, format="%Y-%m-%d")
        except Exception:
            raise ValueError("purchase_date must be in YYYY-MM-DD format")
        return v

    def total_cost(self) -> float:
        """Total cost of this purchase (shares × price)."""
        return self.shares * self.purchase_price
    
    def total_pnl(self, current_price: float) -> float:
        """Calculate the total profit or loss for this purchase based on the current price."""
        return (current_price - self.purchase_price) * self.shares
    
    def total_current_value(self, current_price: float) -> float:
        """Calculate the total current value of this purchase based on the current price."""
        return self.shares * current_price

# Response model for API responses
class Message(BaseModel):
    message: str
    error: Optional[str] = None
    status_code: Optional[int] = Field(200, description="HTTP status code for the response")
    
class Weights(BaseModel):
    """Model for portfolio weights."""
    weights: Dict[str, float]
    
    model_config = {
        "extra": "forbid",  # Forbid extra fields not defined in the model
        "validate_assignment": True  # Validate values on assignment, not just during initialization
    }
    
    @model_validator(mode='after')
    def validate_weights(self) -> 'Weights':
        """Validate that all weights are between 0 and 1 and sum to approximately 1."""
        total_weight = sum(self.weights.values())
        if not (0.99 <= total_weight <= 1.01):
            raise ValueError(f"Weights must sum to approximately 1.0 (current sum: {total_weight:.4f})")
        
        for ticker, weight in self.weights.items():
            if not (0 <= weight <= 1):
                raise ValueError(f"Weight for {ticker} must be between 0 and 1")
        
        return self

# Input Models
class AssetHolding(BaseModel):
    """Model for an individual asset in the portfolio."""
    
    purchases: List[PurchaseEntry] = Field(
        default_factory=list,
        description="List of purchase lots for this asset (per‑share details)",
    )
    # Aggregate fields for backwards compatibility.  If provided, these
    # represent the total shares held, average cost basis per share,
    # initial purchase date and price.  When ``purchases`` is nonempty,
    # these values can be derived automatically.
    shares: Optional[float] = Field(None, ge=0.0, description="Total number of shares held across all purchases")
    cost_basis: Optional[float] = Field(None, ge=0.0, description="Average cost basis per share")
    purchase_date: Optional[str] = Field(None, description="Date of initial purchase (YYYY-MM-DD)")
    purchase_price: Optional[float] = Field(None, ge=0.0, description="Initial purchase price per share")
    
    model_config = {
        "extra": "forbid",  # Forbid extra fields not defined in the model
        "validate_assignment": True  # Validate values on assignment, not just during initialization
    }
    
    @model_validator(mode='after')
    def validate_portfolio_entry(self) -> 'AssetHolding':
        """Validate that the portfolio entry has the required fields."""
        if not self.purchases or len(self.purchases) == 0:
            # Purchases is a required field, throw an error if empty
            raise ValueError("At least one purchase entry is required")
        
        # derive aggregate values from purchases
        total_shares = sum(p.shares for p in self.purchases)
        if total_shares <= 0:
            raise ValueError("Total shares in purchases must be positive")
        # Derive aggregate shares
        object.__setattr__(self, 'shares', total_shares)
        # Compute weighted average cost basis
        total_cost = sum(p.shares * p.purchase_price for p in self.purchases)
        avg_cost = total_cost / total_shares
        object.__setattr__(self, 'cost_basis', avg_cost)
        # Use earliest purchase date as the purchase_date if not provided
        dates = [p.purchase_date for p in self.purchases if p.purchase_date]
        if dates and not self.purchase_date:
            # choose the earliest date string
            earliest = min(dates)
            object.__setattr__(self, 'purchase_date', earliest)
        # Use price of first purchase as purchase_price if not provided
        if not self.purchase_price and self.purchases:
            object.__setattr__(self, 'purchase_price', self.purchases[0].purchase_price)
        
        # Validate date format if provided
        if self.purchase_date is not None:
            try:
                datetime.strptime(self.purchase_date, "%Y-%m-%d")
            except ValueError:
                raise ValueError("Purchase date must be in YYYY-MM-DD format")
        
        return self

class PortfolioHoldings(RootModel):
    """Root model for the portfolio holdings."""
    root: Dict[str, AssetHolding]

class OptimizationInput(BaseModel):
    """Model for portfolio optimization parameters."""
    risk_aversion: float = Field(5.0, ge=0.1, le=100.0, description="Risk aversion parameter (higher = more risk averse)")
    
    model_config = {
        "extra": "forbid"  # Forbid extra fields not defined in the model
    }

class RebalanceInput(BaseModel):
    """Model for portfolio rebalance parameters."""
    target_allocation: Optional[Dict[str, float]] = Field(None, description="Target allocation by ticker")
    
    @model_validator(mode='after')
    def validate_target_allocation(self) -> 'RebalanceInput':
        """Validate target allocation if provided."""
        if self.target_allocation is not None:
            # Check that all values are between 0 and 1
            for ticker, weight in self.target_allocation.items():
                if not (0 <= weight <= 1):
                    raise ValueError(f"Target allocation for {ticker} must be between 0 and 1")
            
            # Check that values sum to approximately 1
            total_weight = sum(self.target_allocation.values())
            if not (0.99 <= total_weight <= 1.01):
                raise ValueError(f"Target allocation weights must sum to 1.0 (current sum: {total_weight:.4f})")
        return self

# Output Models

class RiskMetrics(BaseModel):
    """Model for risk metrics."""
    volatility: float = Field(..., ge=0.0, description="Portfolio volatility (standard deviation of returns)")
    mean_return: float = Field(..., description="Mean daily return")
    var_95: float = Field(..., le=0.0, description="Value at Risk at 95% confidence level (negative value)")
    max_drawdown: float = Field(..., le=0.0, description="Maximum historical drawdown (negative value)")
    sharpe_ratio: float = Field(..., description="Sharpe ratio (return / volatility)")
    risk_category: Literal["Low", "Medium", "High"] = Field(..., description="Risk category classification")
    
    # Optional fields for performance tracking
    purchase_price: Optional[float] = Field(None, ge=0.0, description="Initial purchase price per share")
    purchase_date: Optional[str] = Field(None, description="Date of initial purchase (YYYY-MM-DD)")
    current_price: Optional[float] = Field(None, ge=0.0, description="Current price per share")
    total_return_pct: Optional[float] = Field(None, description="Total return percentage since purchase")

class RiskAnalysisOutput(BaseModel):
    """Model for risk analysis output."""
    risk_analysis: Dict[str, RiskMetrics] = Field(..., description="Risk analysis by ticker")
    data_status: Literal["Complete"] = "Complete"

class CovarianceOutput(BaseModel):
    """Model for covariance matrix output."""
    covariance_matrix: Dict[str, Dict[str, float]] = Field(..., description="Covariance matrix")
    data_status: Literal["Complete"] = "Complete"

class PortfolioMetrics(BaseModel):
    """Model for portfolio-level metrics."""
    expected_return: float = Field(..., description="Expected portfolio return")
    volatility: float = Field(..., ge=0.0, description="Portfolio volatility")
    sharpe_ratio: float = Field(..., description="Portfolio Sharpe ratio")

class OptimizationInfo(BaseModel):
    """Model for optimization metadata."""
    risk_aversion: float = Field(..., ge=0.0, description="Risk aversion parameter used")
    convergence: bool = Field(..., description="Whether optimization converged")
    iterations: int = Field(..., ge=0, description="Number of iterations to convergence")

class OptimizationOutput(BaseModel):
    """Model for optimization output."""
    optimization_result: Dict[str, Any] = Field(..., description="Optimization results")
    data_status: Literal["Complete"] = "Complete"
    
    @model_validator(mode='after')
    def validate_optimization_result(self) -> 'OptimizationOutput':
        """Validate the optimization result structure."""
        required_keys = ['optimal_allocation', 'portfolio_metrics', 'optimization_info']
        for key in required_keys:
            if key not in self.optimization_result:
                raise ValueError(f"Missing required key in optimization result: {key}")
        
        # Validate that allocation weights sum to approximately 1
        allocation = self.optimization_result['optimal_allocation']
        total_weight = sum(allocation.values())
        if not (0.99 <= total_weight <= 1.01):
            raise ValueError(f"Optimal allocation weights must sum to 1.0 (current sum: {total_weight:.4f})")
        
        return self

class FrontierPoint(BaseModel):
    """Model for a point on the efficient frontier."""
    risk_aversion: float = Field(..., ge=0.0, description="Risk aversion parameter used")
    expected_return: float = Field(..., description="Expected portfolio return")
    volatility: float = Field(..., ge=0.0, description="Portfolio volatility")
    sharpe_ratio: float = Field(..., description="Portfolio Sharpe ratio")
    weights: Dict[str, float] = Field(..., description="Asset weights in the portfolio")
    
    @model_validator(mode='after')
    def validate_weights(self) -> 'FrontierPoint':
        """Validate that weights sum to approximately 1."""
        total_weight = sum(self.weights.values())
        if not (0.99 <= total_weight <= 1.01):
            raise ValueError(f"Portfolio weights must sum to 1.0 (current sum: {total_weight:.4f})")
        return self

class EfficientFrontierOutput(BaseModel):
    """Model for efficient frontier output."""
    efficient_frontier: List[FrontierPoint] = Field(..., description="Points on the efficient frontier")
    data_status: Literal["Complete"] = "Complete"

class EnhancedRiskMetrics(BaseModel):
    """Model for enhanced risk metrics."""
    var_95: float = Field(..., le=0.0, description="Value at Risk at 95% confidence level (negative value)")
    cvar_95: float = Field(..., le=0.0, description="Conditional Value at Risk at 95% confidence level (negative value)")
    max_drawdown_estimate: float = Field(..., le=0.0, description="Estimated maximum drawdown (negative value)")

class RiskReportPoint(BaseModel):
    """Model for a point in the risk report."""
    type: str = Field(..., description="Type of portfolio point")
    expected_return: float = Field(..., description="Expected portfolio return")
    volatility: float = Field(..., ge=0.0, description="Portfolio volatility")
    sharpe_ratio: float = Field(..., description="Portfolio Sharpe ratio")
    weights: Dict[str, float] = Field(..., description="Asset weights in the portfolio")
    risk_metrics: EnhancedRiskMetrics = Field(..., description="Enhanced risk metrics")
    risk_aversion: Optional[float] = Field(None, ge=0.0, description="Risk aversion parameter if applicable")

class PortfolioSummary(BaseModel):
    """Model for portfolio summary."""
    current: PortfolioMetrics = Field(..., description="Current portfolio metrics")
    min_variance: PortfolioMetrics = Field(..., description="Minimum variance portfolio metrics")
    max_sharpe: PortfolioMetrics = Field(..., description="Maximum Sharpe ratio portfolio metrics")

class RiskReportData(BaseModel):
    """Model for comprehensive risk report data."""
    efficient_frontier: List[RiskReportPoint] = Field(..., description="Points on the efficient frontier")
    portfolio_summary: PortfolioSummary = Field(..., description="Summary of key portfolios")
    asset_risk_profiles: Dict[str, RiskMetrics] = Field(..., description="Risk profiles by asset")
    correlation_matrix: Dict[str, Dict[str, float]] = Field(..., description="Correlation matrix")

class RiskReportOutput(BaseModel):
    """Model for risk report output."""
    risk_report: RiskReportData = Field(..., description="Risk report data")
    data_status: Literal["Complete"] = "Complete"

class AssetPosition(BaseModel):
    """Pydantic model representing a portfolio position for a single ticker."""

    ticker: str = Field(..., description="Ticker symbol of the asset")
    weight: float = Field(..., ge=0.0, le=1.0, description="Portfolio weight between 0 and 1")
    purchases: List[PurchaseEntry] = Field(
        default_factory=list,
        description="List of purchase lots for this asset",
    )

    @field_validator("weight")
    def weight_in_range(cls, v: float) -> float:
        if v < 0.0 or v > 1.0:
            raise ValueError("weight must be between 0 and 1")
        return v

    def total_shares(self) -> float:
        """Sum of shares held across all purchase lots."""
        return float(sum(p.shares for p in self.purchases))

    def average_cost(self) -> float:
        """Weighted average cost per share across all purchases."""
        total_cost = sum(p.total_cost() for p in self.purchases)
        total_shares = self.total_shares()
        return float(total_cost / total_shares) if total_shares > 0 else 0.0

    def total_invested(self) -> float:
        """Total invested amount across all purchase lots."""
        return float(sum(p.total_cost() for p in self.purchases))

# -----------------------------------------------------------------------------
# Output data models
#
# In addition to the internal ``PurchaseEntry`` and ``AssetPosition`` models
# defined above, downstream code may wish to marshal computed risk statistics
# into strongly typed Pydantic models.  The following classes mirror the
# corresponding models in the provided API description.  They are defined
# here so that functions can return rich objects instead of plain
# dictionaries.  If you have already imported identical classes from
# another module, you can safely ignore these definitions; the names
# defined here are intended to be used locally within this module.

class RiskMetrics(BaseModel):
    """Model for risk metrics for a single asset or portfolio.

    Parameters
    ----------
    volatility : float
        Standard deviation of returns (per period).  Must be non‑negative.
    mean_return : float
        Mean return over the observation window.
    var_95 : float
        Value at Risk at the 95% confidence level (negative value).
    max_drawdown : float
        Maximum drawdown (negative value).
    sharpe_ratio : float
        Sharpe ratio (mean excess return divided by volatility).
    risk_category : {'Low', 'Medium', 'High'}
        Categorical bucket based on annualized volatility.
    purchase_price : float, optional
        Initial purchase price per share (if applicable).
    purchase_date : str, optional
        Date of initial purchase (YYYY‑MM‑DD).
    current_price : float, optional
        Current price per share.
    total_return_pct : float, optional
        Total return percentage since purchase.
    """

    volatility: float = Field(..., ge=0.0)
    mean_return: float = Field(...)
    var_95: float = Field(..., le=0.0)
    max_drawdown: float = Field(..., le=0.0)
    sharpe_ratio: float = Field(...)
    risk_category: Literal['Low', 'Medium', 'High'] = Field(...)

    # Optional fields for linking to purchase history
    purchase_price: Optional[float] = Field(None, ge=0.0)
    purchase_date: Optional[str] = Field(None)
    current_price: Optional[float] = Field(None, ge=0.0)
    total_return_pct: Optional[float] = Field(None)

    @field_validator('purchase_date')
    def validate_purchase_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return v
        try:
            pd.to_datetime(v, format="%Y-%m-%d")
        except Exception:
            raise ValueError("purchase_date must be in YYYY-MM-DD format")
        return v


class PortfolioMetrics(BaseModel):
    """Model for portfolio‑level metrics.

    Parameters
    ----------
    expected_return : float
        Mean portfolio return per period.
    volatility : float
        Standard deviation of portfolio returns (per period).  Must be non‑negative.
    sharpe_ratio : float
        Sharpe ratio of the portfolio.
    beta : float, optional
        Portfolio beta relative to the benchmark (SPY).  None when no
        benchmark data is available.
    alpha : float, optional
        Jensen's alpha relative to the benchmark (SPY).  None when no
        benchmark data is available.
    """

    expected_return: float = Field(...)
    volatility: float = Field(..., ge=0.0)
    sharpe_ratio: float = Field(...)
    beta: Optional[float] = Field(None, description="Portfolio beta relative to benchmark (SPY)")
    alpha: Optional[float] = Field(None, description="Jensen's alpha relative to benchmark (SPY)")


class CovarianceOutput(BaseModel):
    """Model for covariance matrix output.

    Attributes
    ----------
    covariance_matrix : Dict[str, Dict[str, float]]
        Nested mapping where the outer keys and inner keys are ticker symbols and
        the values are the pairwise covariances.
    data_status : Literal['Complete']
        Status indicator for downstream API consumers.  Always 'Complete'.
    """

    covariance_matrix: Dict[str, Dict[str, float]]
    data_status: Literal['Complete'] = 'Complete'




# Utility functions

def validate_portfolio_data(data: Dict) -> PortfolioHoldings:
    """
    Validate portfolio data against the PortfolioHoldings model.
    
    Args:
        data: Dictionary containing portfolio holdings data
        
    Returns:
        PortfolioHoldings: Validated portfolio holdings model
        
    Raises:
        ValueError: If validation fails with details about the error
    """
    try:
        return PortfolioHoldings(root=data)
    except Exception as e:
        raise ValueError(f"Invalid portfolio data: {str(e)}")

def validate_optimization_input(data: Dict) -> OptimizationInput:
    """
    Validate optimization input data against the OptimizationInput model.
    
    Args:
        data: Dictionary containing optimization parameters
        
    Returns:
        OptimizationInput: Validated optimization input model
        
    Raises:
        ValueError: If validation fails with details about the error
    """
    try:
        return OptimizationInput(**data)
    except Exception as e:
        raise ValueError(f"Invalid optimization input: {str(e)}")

def validate_rebalance_input(data: Dict) -> RebalanceInput:
    """
    Validate rebalance input data against the RebalanceInput model.
    
    Args:
        data: Dictionary containing rebalancing parameters
        
    Returns:
        RebalanceInput: Validated rebalance input model
        
    Raises:
        ValueError: If validation fails with details about the error
    """
    try:
        return RebalanceInput(**data)
    except Exception as e:
        raise ValueError(f"Invalid rebalance input: {str(e)}")

__all__ = [
    'PurchaseEntry',
    'Message',
    'Weights',
    'AssetHolding',
    'PortfolioHoldings',
    'OptimizationInput',
    'RebalanceInput',
    'RiskMetrics',
    'RiskAnalysisOutput',
    'CovarianceOutput',
    'PortfolioMetrics',
    'OptimizationInfo',
    'OptimizationOutput',
    'FrontierPoint',
    'EfficientFrontierOutput',
    'EnhancedRiskMetrics',
    'RiskReportPoint',
    'PortfolioSummary',
    'PortfolioPerformance',
    'PortfolioRiskMetrics',
    'RiskReportData',
    'RiskReportOutput',
    'AssetPosition',
    'validate_portfolio_data',
    'validate_optimization_input',
    'validate_rebalance_input',
    'validate_portfolio_data',
    'validate_optimization_input',
    'validate_rebalance_input'
]