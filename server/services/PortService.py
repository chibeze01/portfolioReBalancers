"""
Portfolio Service for handling portfolio data analysis and calculations.
This service provides functionality to analyze stock returns, calculate risk profiles,
covariance matrices, and other portfolio analytics.
"""

from typing import Dict
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import logging

from models import PortfolioHoldings, Weights

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('PortService')

class PortfolioService:
    """Service class for portfolio analysis and calculations."""
    
    def __init__(self):
        """Initialize the portfolio service."""
        self.interval = '4h'  # 4-hourly data
        self.period = '1mo'   # Default historical data period
        
    def get_stock_data(self, tickers, period=None, interval=None):
        """
        Fetch historical stock data for the given tickers.
        
        Args:
            tickers (list): List of ticker symbols
            period (str, optional): Period of historical data, e.g., '1mo', '3mo', '6mo', '1y'
            interval (str, optional): Interval for the data, e.g., '1h', '4h', '1d'
            
        Returns:
            pd.DataFrame: DataFrame containing historical stock data
        """
        if period is None:
            period = self.period
        if interval is None:
            interval = self.interval
            
        try:
            logger.info(f"Fetching data for {tickers} with period={period} and interval={interval}")
            data = yf.download(
                tickers=tickers,
                period=period,
                interval=interval,
                group_by='ticker',
                auto_adjust=True
            )
            
            # Ensure we have data
            if data.empty:
                logger.warning(f"No data returned for tickers: {tickers}")
                return pd.DataFrame()
            
            return data
        except Exception as e:
            logger.error(f"Error fetching stock data: {e}")
            # Create more informative error message
            raise Exception(f"Error in get_stock_data: {str(e)}")
            
    def calculate_returns(self, portfolio_data):
        """
        Calculate returns for each stock in the portfolio.
        
        Args:
            portfolio_data (dict): Portfolio data containing stock tickers and weights
            
        Returns:
            dict: Dictionary containing returns data for each stock
        """
        try:
            # Extract tickers from the portfolio data
            tickers = list(portfolio_data.keys())
            
            # Get historical data
            historical_data = self.get_stock_data(tickers)
            
            # Calculate returns for each stock
            returns_data = {}
            for ticker in tickers:
                # Get closing prices for the ticker
                if ticker not in historical_data.columns.levels[0]:
                    logger.warning(f"No data available for ticker: {ticker}")
                    continue
                    
                close_prices = historical_data[ticker]['Close']
                
                # Calculate percentage returns
                returns = close_prices.pct_change().dropna()
                
                # Calculate some basic statistics
                mean_return = returns.mean()
                std_dev = returns.std()
                
                returns_data[ticker] = {
                    'returns': returns,
                    'mean_return': mean_return,
                    'std_dev': std_dev
                }
                
            return returns_data
            
        except Exception as e:
            logger.error(f"Error calculating returns: {e}")
            raise Exception(f"Error in calculate_returns: {str(e)}")
            
    def create_risk_profiles(self, returns_data, portfolio_data=None):
        """
        Create risk profiles for each stock based on returns data.
        
        Args:
            returns_data (dict): Dictionary containing returns data for each stock
            portfolio_data (dict, optional): Portfolio data with additional asset information
            
        Returns:
            dict: Dictionary containing risk profiles for each stock
        """
        risk_profiles = {}
        
        try:
            for ticker, data in returns_data.items():
                # Extract relevant metrics
                mean_return = data['mean_return']
                std_dev = data['std_dev']
                returns = data['returns']
                
                # Check if we have sufficient data points
                if len(returns) == 0:
                    logger.warning(f"No return data for ticker {ticker}")
                    var_95 = 0
                    max_drawdown = 0
                else:
                    # Calculate Value at Risk (VaR) at 95% confidence level
                    var_95 = np.percentile(returns, 5) if len(returns) >= 20 else returns.min()
                    
                    # Calculate max drawdown with safety checks
                    if len(returns) > 1:
                        cumulative_returns = (1 + returns).cumprod()
                        if not cumulative_returns.empty:
                            max_drawdown = (cumulative_returns / cumulative_returns.cummax()).min() - 1
                        else:
                            max_drawdown = 0
                    else:
                        max_drawdown = 0
                
                # Calculate Sharpe Ratio (assuming risk-free rate of 0 for simplicity)
                sharpe_ratio = mean_return / std_dev if std_dev > 0 else 0
                
                # Determine risk category based on volatility (std_dev)
                if std_dev < 0.01:
                    risk_category = "Low"
                elif std_dev < 0.02:
                    risk_category = "Medium"
                else:
                    risk_category = "High"
                
                # Compile risk profile
                risk_profile = {
                    'volatility': std_dev,
                    'mean_return': mean_return,
                    'var_95': var_95,
                    'max_drawdown': max_drawdown,
                    'sharpe_ratio': sharpe_ratio,
                    'risk_category': risk_category
                }
                
                # Add performance metrics if portfolio data is provided
                if portfolio_data and ticker in portfolio_data:
                    asset = portfolio_data[ticker]
                    if ('purchase_price' in asset and asset['purchase_price'] is not None and
                        'purchase_date' in asset and asset['purchase_date'] is not None):
                        
                        # Calculate performance since purchase
                        try:
                            # Get recent price data
                            recent_data = self.get_stock_data([ticker], period='1d', interval='1d')
                            if not recent_data.empty and ticker in recent_data.columns.levels[0]:
                                current_price = recent_data[ticker]['Close'].iloc[-1]
                                purchase_price = asset['purchase_price']
                                
                                # Calculate performance metrics
                                total_return_pct = (current_price - purchase_price) / purchase_price
                                
                                # Add to risk profile
                                risk_profile.update({
                                    'purchase_price': purchase_price,
                                    'purchase_date': asset['purchase_date'],
                                    'current_price': current_price,
                                    'total_return_pct': total_return_pct
                                })
                        except Exception as e:
                            logger.error(f"Error calculating performance metrics for {ticker}: {e}")
                
                risk_profiles[ticker] = risk_profile
                
            return risk_profiles
            
        except Exception as e:
            logger.error(f"Error creating risk profiles: {e}")
            raise Exception(f"Error in create_risk_profiles: {str(e)}")
            
    def calculate_covariance_matrix(self, returns_data):
        """
        Calculate the covariance matrix for the portfolio.
        
        Args:
            returns_data (dict): Dictionary containing returns data for each stock
            
        Returns:
            pd.DataFrame: Covariance matrix
        """
        try:
            # Handle empty returns_data case
            if not returns_data:
                logger.warning("No returns data provided for covariance calculation")
                return pd.DataFrame()
                
            # Extract returns series for each stock
            returns_series = {}
            for ticker, data in returns_data.items():
                if 'returns' in data and isinstance(data['returns'], pd.Series) and not data['returns'].empty:
                    # Explicitly handle MultiIndex if present
                    if isinstance(data['returns'].index, pd.MultiIndex):
                        # Convert MultiIndex Series to regular Series with same values
                        returns_series[ticker] = pd.Series(data['returns'].values, 
                                                          index=data['returns'].index.get_level_values(0))
                    else:
                        returns_series[ticker] = data['returns']
            
            # Handle case with no valid returns series
            if not returns_series:
                logger.warning("No valid returns series for covariance calculation")
                return pd.DataFrame()
            
            # Create a DataFrame with all returns
            returns_df = pd.DataFrame(returns_series)
            
            # Handle single stock case
            if len(returns_series) == 1:
                ticker = list(returns_series.keys())[0]
                variance = returns_df[ticker].var()
                cov_matrix = pd.DataFrame([[variance]], index=[ticker], columns=[ticker])
            else:
                # Calculate the covariance matrix for multiple stocks
                cov_matrix = returns_df.cov()
            
            return cov_matrix
            
        except Exception as e:
            logger.error(f"Error calculating covariance matrix: {e}")
            raise Exception(f"Error in calculate_covariance_matrix: {str(e)}")
            
    def calculate_portfolio_risk(self, portfolio_data, cov_matrix):
        """
        Calculate the overall risk of the portfolio.
        
        Args:
            portfolio_data (dict): Portfolio data containing stock tickers and weights
            cov_matrix (pd.DataFrame): Covariance matrix
            
        Returns:
            float: Portfolio risk (standard deviation)
        """
        try:
            # Extract tickers and weights
            tickers = []
            weights = []
            
            for ticker, data in portfolio_data.items():
                if 'weight' in data:
                    tickers.append(ticker)
                    weights.append(data['weight'])
            
            # Convert to numpy arrays
            weights = np.array(weights)
            
            # Normalize weights if they don't sum to 1
            weights = weights / np.sum(weights)
            
            # Ensure the covariance matrix has the same stocks as the portfolio
            filtered_cov = cov_matrix.loc[tickers, tickers]
            
            # Calculate portfolio variance
            portfolio_variance = weights.T @ filtered_cov @ weights
            
            # Calculate portfolio risk (standard deviation)
            portfolio_risk = np.sqrt(portfolio_variance)
            
            return portfolio_risk
            
        except Exception as e:
            logger.error(f"Error calculating portfolio risk: {e}")
            raise Exception(f"Error in calculate_portfolio_risk: {str(e)}")
            
    def calculate_portfolio_expected_return(self, portfolio_data, returns_data):
        """
        Calculate the expected return of the portfolio.
        
        Args:
            portfolio_data (dict): Portfolio data containing stock tickers and weights
            returns_data (dict): Dictionary containing returns data for each stock
            
        Returns:
            float: Expected portfolio return
        """
        try:
            portfolio_return = 0.0
            total_weight = 0.0
            
            for ticker, data in portfolio_data.items():
                if ticker in returns_data and 'weight' in data:
                    weight = data['weight']
                    mean_return = returns_data[ticker]['mean_return']
                    portfolio_return += weight * mean_return
                    total_weight += weight
            
            # Normalize if weights don't sum to 1
            if total_weight > 0:
                portfolio_return = portfolio_return / total_weight
                
            return portfolio_return
            
        except Exception as e:
            logger.error(f"Error calculating portfolio expected return: {e}")
            raise Exception(f"Error in calculate_portfolio_expected_return: {str(e)}")
            
    def analyze_portfolio(self, portfolio_data):
        """
        Main function to analyze a portfolio.
        
        Args:
            portfolio_data (dict): Portfolio data containing stock tickers and weights
            
        Returns:
            dict: Portfolio analysis results
        """
        try:
            # Calculate returns
            returns_data = self.calculate_returns(portfolio_data)
            
            # Create risk profiles with performance metrics if available
            risk_profiles = self.create_risk_profiles(returns_data, portfolio_data)
            
            # Calculate covariance matrix
            cov_matrix = self.calculate_covariance_matrix(returns_data)
            
            # Calculate portfolio risk
            portfolio_risk = self.calculate_portfolio_risk(portfolio_data, cov_matrix)
            
            # Calculate portfolio expected return
            portfolio_return = self.calculate_portfolio_expected_return(portfolio_data, returns_data)
            
            # Determine overall portfolio risk category
            if portfolio_risk < 0.01:
                portfolio_risk_category = "Low"
            elif portfolio_risk < 0.02:
                portfolio_risk_category = "Medium"
            else:
                portfolio_risk_category = "High"
            
            # Calculate portfolio performance if possible
            portfolio_performance = self._calculate_portfolio_performance(portfolio_data)
            
            # Calculate Sharpe ratio
            sharpe_ratio = portfolio_return / portfolio_risk if portfolio_risk > 0 else 0
            
            # Compile results
            result = {
                'portfolio_return': portfolio_return,
                'portfolio_risk': portfolio_risk,
                'portfolio_risk_category': portfolio_risk_category,
                'stock_risk_profiles': risk_profiles,
                'covariance_matrix': cov_matrix.to_dict(),
                'sharpe_ratio': sharpe_ratio
            }
            
            # Add performance metrics if available
            if portfolio_performance:
                result.update(portfolio_performance)
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing portfolio: {e}")
            raise Exception(f"Error in analyze_portfolio: {str(e)}")
            
    def _calculate_portfolio_performance(self, portfolio_data):
        """
        Calculate overall portfolio performance metrics based on purchase information.
        
        Args:
            portfolio_data (dict): Portfolio data containing stock tickers and details
            
        Returns:
            dict: Portfolio performance metrics or None if data is insufficient
        """
        try:
            performance_metrics = {}
            total_value_current = 0
            total_cost_basis = 0
            has_sufficient_data = False
            
            for ticker, data in portfolio_data.items():
                if ('purchase_price' in data and data['purchase_price'] is not None and
                    'shares' in data and data['shares'] is not None):
                    
                    has_sufficient_data = True
                    
                    # Try to get current price data
                    try:
                        recent_data = self.get_stock_data([ticker], period='1d', interval='1d')
                        if not recent_data.empty and ticker in recent_data.columns.levels[0]:
                            current_price = recent_data[ticker]['Close'].iloc[-1]
                            shares = data['shares']
                            purchase_price = data['purchase_price']
                            
                            # Calculate current value and cost basis
                            current_value = current_price * shares
                            cost_basis = purchase_price * shares
                            
                            total_value_current += current_value
                            total_cost_basis += cost_basis
                    except Exception as e:
                        logger.warning(f"Error getting price data for {ticker}: {e}")
            
            # Calculate overall portfolio performance if we have sufficient data
            if has_sufficient_data and total_cost_basis > 0:
                total_return_pct = (total_value_current - total_cost_basis) / total_cost_basis
                total_return_amount = total_value_current - total_cost_basis
                
                performance_metrics = {
                    'portfolio_performance': {
                        'current_value': float(total_value_current),
                        'cost_basis': float(total_cost_basis),
                        'total_return_percentage': float(total_return_pct),
                        'total_return_amount': float(total_return_amount)
                    }
                }
                
            return performance_metrics
            
        except Exception as e:
            logger.error(f"Error calculating portfolio performance: {e}")
            return None

    def get_current_price(self, ticker: str, as_of_date: str = None) -> float:
        """
        Get the current price of a stock ticker.
        
        Args:
            ticker (str): Stock ticker symbol
            as_of_date (str, optional): Date to get the price for, in 'YYYY-MM-DD' format
            
        Returns:
            float: Current price of the stock
        """
        try:
            if as_of_date:
                # Fetch historical data for the specific date
                historical_data = yf.download(ticker, start=as_of_date, end=as_of_date, interval='1d')
                if not historical_data.empty and 'Close' in historical_data.columns:
                    return historical_data['Close'].iloc[0]
            else:
                # Fetch the latest price
                return yf.Ticker(ticker).info['currentPrice']
        except Exception as e:
            logger.error(f"Error fetching current price for {ticker}: {e}")
            return None

    def Compute_Portfolio_Weights(self, portfolio_data: PortfolioHoldings, as_of_date: str = None) -> Weights:
        """
        Compute the weights of each asset in the portfolio.
        
        Args:
            portfolio_data (dict): Portfolio data containing stock tickers and details

        Returns:
            dict: Dictionary with ticker as key and weight as value
        """
        try:
            weights = {}
            total_cost_value = sum([ sum([ purchase.total_cost() for purchase in asset.purchases ]) for asset in portfolio_data.root.values() ])
            current_price = { ticker: self.get_current_price(ticker, as_of_date) for ticker in portfolio_data.root.keys() }
            total_current_value = sum([ sum([ purchase.total_current_value(current_price[ticker]) for purchase in asset.purchases ]) for ticker, asset in portfolio_data.root.items() ])
            # Calculate weights for each asset based on the pnls and the total value

            for ticker, asset in portfolio_data.root.items():
                if current_price[ticker] is not None:
                    asset_value = sum([ purchase.shares * current_price[ticker] for purchase in asset.purchases ])
                    weights[ticker] = asset_value / total_current_value if total_current_value > 0 else 0
                    
            logger.info(f"Computed portfolio weights: {weights}")
            return Weights(weights=weights)

        except Exception as e:
            logger.error(f"Error computing portfolio weights: {e}")
            raise Exception(f"Error in Compute_Porfolio_Weights: {str(e)}")