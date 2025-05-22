from flask import Flask, jsonify, request, abort

app = Flask(__name__)
portfolio_data = {}

# Error Handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad Request', 'message': str(error.description), 'status_code': 400}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not Found', 'message': str(error.description), 'status_code': 404}), 404

@app.errorhandler(500)
def internal_server_error(error):
    # Using current_app.logger for logging within app context
    # Ensure current_app is imported or app is used if current_app is not appropriate here
    app.logger.error(f"Internal Server Error: {error}")
    return jsonify({'error': 'Internal Server Error', 'message': 'An unexpected error occurred.', 'status_code': 500}), 500

@app.route('/')
def home():
    return 'Portfolio Balancer API is running!'

@app.route('/portfolio/submit', methods=['POST'])
def submit_portfolio():
    # Use silent=True to prevent Werkzeug's default 400 error, allowing custom handling
    data = request.get_json(silent=True)

    if data is None:
        # If request.data is also empty, it means no data was sent.
        # If request.data is not empty but data is None, it was malformed JSON.
        if not request.data:
            abort(400, description="No data provided in the request.")
        else:
            abort(400, description="Malformed JSON or invalid content type.")
    
    if not isinstance(data, dict) or not data: # Checks if data is not a dict or is an empty dict
        abort(400, description="Invalid data format: JSON object expected and cannot be empty.")
    
    try:
        portfolio_data['current_portfolio'] = data
        return jsonify({'message': 'Portfolio data submitted and stored successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error storing portfolio data: {e}")
        abort(500, description="An internal error occurred while storing portfolio data.")


@app.route('/portfolio/risk-analysis', methods=['GET'])
def get_risk_analysis():
    if 'current_portfolio' not in portfolio_data:
        abort(404, description='No portfolio data submitted yet. Please use POST /portfolio/submit first.')
    return jsonify({'risk_analysis': 'pending_implementation', 'data_status': 'Portfolio data found'}), 200

@app.route('/portfolio/covariance-matrix', methods=['GET'])
def get_covariance_matrix():
    if 'current_portfolio' not in portfolio_data:
        abort(404, description='No portfolio data submitted yet. Please use POST /portfolio/submit first.')
    return jsonify({'covariance_matrix': 'pending_implementation', 'data_status': 'Portfolio data found'}), 200

@app.route('/portfolio/rebalance', methods=['POST'])
def rebalance_portfolio():
    if 'current_portfolio' not in portfolio_data:
        abort(404, description='No portfolio data submitted yet. Please use POST /portfolio/submit first.')
    # Placeholder for rebalancing logic, might use request.get_json() if it needs payload
    return jsonify({'rebalancing_suggestion': 'pending_implementation', 'data_status': 'Portfolio data found'}), 200

@app.route('/portfolio/risk-score', methods=['GET'])
def get_risk_score():
    if 'current_portfolio' not in portfolio_data:
        abort(404, description='No portfolio data submitted yet. Please use POST /portfolio/submit first.')
    return jsonify({'portfolio_risk_score': 'pending_implementation', 'data_status': 'Portfolio data found'}), 200

if __name__ == '__main__':
    app.run(debug=True)
