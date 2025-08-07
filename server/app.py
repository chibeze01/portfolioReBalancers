"""
Portfolio Rebalancer API

This Flask API provides endpoints for portfolio analysis, optimization, 
and rebalancing based on Modern Portfolio Theory.
"""

from typing import List, Dict, Any
from flask import Flask, jsonify, request, abort
from flask_pydantic_spec import FlaskPydanticSpec, Response, Request
from pandas import DataFrame
from services.PortService import PortfolioService
import logging
import numpy as np
from scipy.optimize import minimize
import math
from models import (
    Message,
    PortfolioHoldings,
    Weights,
    validate_portfolio_data,
    validate_optimization_input,
    validate_rebalance_input,
    RiskAnalysisOutput,
    CovarianceOutput,
    OptimizationOutput,
    EfficientFrontierOutput,
    RiskReportOutput,
    RiskReportData,
    PortfolioSummary,
    EnhancedRiskMetrics,
    RiskReportPoint,
    FrontierPoint,
    PortfolioMetrics,
    OptimizationInfo
)
from pydantic import ValidationError

import portfolio_metrics as pm
from flask_pydantic import validate

app = Flask(__name__)
api = FlaskPydanticSpec('flask')
portfolio_data = {}  # In-memory storage for portfolio data

# Initialize the portfolio service
portfolio_service = PortfolioService()

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

BenchMarkDataCache:Dict[str, DataFrame] = {}  # Placeholder for BenchMarkData type
StockDataCache:Dict[str, DataFrame] = {}  # Placeholder for StockData type

# Error Handlers
def bad_request(error):
    """
    Handle Bad Request (400) errors with a consistent JSON response.
    """
    app.logger.error(f"Bad Request: {error}")
    return jsonify({
        'error': 'Bad Request', 
        'message': str(error.description), 
        'status_code': 400
    }), 400

def not_found(error):
    """Handle Not Found (404) errors with a consistent JSON response."""
    app.logger.error(f"Not Found: {error}")
    return jsonify({
        'error': 'Not Found', 
        'message': str(error.description), 
        'status_code': 404
    }), 404

def internal_server_error(error):
    """Handle Internal Server Error (500) with a consistent JSON response."""
    app.logger.error(f"Internal Server Error: {error}")
    return jsonify({
        'error': 'Internal Server Error', 
        'message': 'An unexpected error occurred.', 
        'status_code': 500
    }), 500
###


@app.route('/')
@api.validate(resp=Response(HTTP_200=Message))
def home():
    """Home route to verify API is running.
    ---
    responses:
      200:
        description: A successful response
        examples:
          application/json: { "message": "Portfolio Balancer API is running!" }
    """
    return jsonify(message='Portfolio Balancer API is running!')

@app.route('/portfolio/submit', methods=['POST'])
@api.validate(body=PortfolioHoldings, resp=Response(HTTP_200=Message, HTTP_400=Message, HTTP_500=Message))
@validate()
def submit_portfolio(body: PortfolioHoldings):
    """
    Submit portfolio data for analysis and storage.
    
    Expects a JSON object where each key is a ticker symbol and each value 
    is an object with a 'weight' field (required) and optional 'shares' 
    and 'cost_basis' fields.
    """
    try:
        # Store the validated data
        portfolio_data['current_portfolio'] = body.root  
        return jsonify({'message': 'Portfolio data submitted and stored successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error storing portfolio data: {e}")
        abort(500, description="An internal error occurred while storing portfolio data.")


@app.route('/current-portfolio/<user_id>', methods=['GET'])
@api.validate(resp=Response(HTTP_200=PortfolioHoldings, HTTP_404=Message))
@validate()
def get_current_portfolio(user_id: int):
    """
    Get the current portfolio data.
    
    Returns:
        JSON object with the current portfolio holdings.
    """
    # call the database to collect information about the users current portfolio
    if 'current_portfolio' not in portfolio_data:
        app.logger.warning(f"No portfolio data found for user {user_id}")
        abort(404, description="No portfolio data found for the user.")
        
    # Return the current portfolio data
    app.logger.info(f"Returning current portfolio for user {user_id}")
    if not portfolio_data['current_portfolio']:
        app.logger.warning(f"Current portfolio is empty for user {user_id}")
        return jsonify({}), 200
    # Return the current portfolio data
    app.logger.info(f"Current portfolio for user {user_id}: {portfolio_data['current_portfolio']}")    
    return jsonify(portfolio_data['current_portfolio']), 200

@app.route('/portfolio/metrics', methods=['POST'])
@api.validate(body=PortfolioHoldings, resp=Response(HTTP_200=PortfolioMetrics))
@validate()
def build_portfolio_metrics(body: PortfolioHoldings) -> PortfolioMetrics:
    """
    Build portfolio metrics based on the provided holdings.
    """
    try:
        # Store the validated data
        portfolio_data = body.root
        weights = portfolio_service.Compute_Portfolio_Weights(portfolio_data)
        if not weights:
            app.logger.error("No weights provided for building portfolio metrics.")
            abort(400, description="Weights are required for building portfolio metrics.")
        
        # temp code to save Api calls to yfinance
        if StockDataCache.get(",".join(list(weights.keys()))) is None:
            # collect the historical data from the portfolio service
            price_data = pm.fetch_price_data(list(weights.keys()))
            ## update the StockData cache
            StockDataCache[",".join(list(weights.keys()))] = price_data
        else:
            price_data = StockDataCache.get(",".join(list(weights.keys())))
        
        returns = pm.compute_returns(price_data)
        
        if BenchMarkDataCache.get('SPY') is None:
            # Fetch benchmark data if not already cached
            benchmark = 'SPY'  # Example benchmark, can be parameterized
            benchmark_data = pm.fetch_price_data([benchmark])
            # Update the BenchMarkData cache
            BenchMarkDataCache['SPY'] = benchmark_data
        else:
            benchmark_data = BenchMarkDataCache.get('SPY')
        
        benchmark_returns = pm.compute_returns(benchmark_data)
        return pm.build_portfolio_metrics(weights, returns, benchmark_returns)
    except Exception as e:
        app.logger.error(f"Error storing portfolio data: {e}")
        abort(500, description="An internal error occurred while storing portfolio data.")
        
        
@app.route('/portfolio/weights', methods=['POST'])
@api.validate(body=PortfolioHoldings, resp=Response(HTTP_200=Weights))
@validate()
def portfolio_weights(body: PortfolioHoldings) -> Weights:
    """
    Get the portfolio weights for the provided holdings.
    """
    try:
        # Compute portfolio weights using the service
        weights = portfolio_service.Compute_Portfolio_Weights(body)
        return weights
    except Exception as e:
        app.logger.error(f"Error computing portfolio weights: {e}")
        abort(500, description="An internal error occurred while computing portfolio weights.")

if __name__ == '__main__':
    api.register(app)
    app.run(debug=True)

