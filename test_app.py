import unittest
import json
from app import app, portfolio_data # Import the Flask app instance and portfolio_data

class PortfolioBalancerAPITestCase(unittest.TestCase):

    def setUp(self):
        """Set up test client and other test variables."""
        app.config['TESTING'] = True
        self.client = app.test_client()
        # Reset portfolio_data before each test to ensure test isolation
        portfolio_data.clear()

    def tearDown(self):
        """Clean up after each test."""
        # Ensure portfolio_data is clean after tests, if necessary
        portfolio_data.clear()

    def test_home_route(self):
        """Test the home route."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.decode(), 'Portfolio Balancer API is running!')

    def test_submit_portfolio_success(self):
        """Test successful portfolio submission."""
        sample_payload = {'stocks': [{'ticker': 'AAPL', 'shares': 10}, {'ticker': 'GOOGL', 'shares': 5}]}
        response = self.client.post('/portfolio/submit',
                                     data=json.dumps(sample_payload),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 200)
        json_response = json.loads(response.data.decode())
        self.assertEqual(json_response['message'], 'Portfolio data submitted and stored successfully')
        self.assertIn('current_portfolio', portfolio_data)
        self.assertEqual(portfolio_data['current_portfolio'], sample_payload)

    def test_submit_portfolio_no_json_data(self):
        """Test portfolio submission with no JSON data."""
        response = self.client.post('/portfolio/submit',
                                     content_type='application/json') # Sending no data
        self.assertEqual(response.status_code, 400)
        json_response = json.loads(response.data.decode())
        self.assertEqual(json_response['error'], 'Bad Request')
        self.assertEqual(json_response['message'], 'No data provided in the request.')


    def test_submit_portfolio_empty_json_object(self):
        """Test portfolio submission with empty JSON object {}."""
        response = self.client.post('/portfolio/submit',
                                     data=json.dumps({}),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 400)
        json_response = json.loads(response.data.decode())
        self.assertEqual(json_response['error'], 'Bad Request')
        self.assertEqual(json_response['message'], 'Invalid data format: JSON object expected and cannot be empty.')


    def test_get_endpoints_no_data_submitted(self):
        """Test GET endpoints when no portfolio data has been submitted."""
        endpoints = ['/portfolio/risk-analysis', '/portfolio/covariance-matrix', '/portfolio/risk-score']
        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, 404)
                json_response = json.loads(response.data.decode())
                self.assertEqual(json_response['error'], 'Not Found')
                # Ensure this matches the consistent message in app.py
                self.assertEqual(json_response['message'], 'No portfolio data submitted yet. Please use POST /portfolio/submit first.')

    def test_get_endpoints_with_data_submitted(self):
        """Test GET endpoints after portfolio data has been submitted."""
        sample_payload = {'stocks': [{'ticker': 'MSFT', 'shares': 20}]}
        submit_response = self.client.post('/portfolio/submit',
                                           data=json.dumps(sample_payload),
                                           content_type='application/json')
        self.assertEqual(submit_response.status_code, 200) 

        endpoints_and_keys = {
            '/portfolio/risk-analysis': 'risk_analysis',
            '/portfolio/covariance-matrix': 'covariance_matrix',
            '/portfolio/risk-score': 'portfolio_risk_score' # Corrected typo
        }

        for endpoint, key in endpoints_and_keys.items():
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, 200)
                json_response = json.loads(response.data.decode())
                self.assertIn(key, json_response)
                self.assertEqual(json_response[key], 'pending_implementation')
                self.assertEqual(json_response['data_status'], 'Portfolio data found')

    def test_rebalance_portfolio_no_data_submitted(self):
        """Test /portfolio/rebalance when no portfolio data has been submitted."""
        response = self.client.post('/portfolio/rebalance',
                                      data=json.dumps({'strategy': 'conservative'}), 
                                      content_type='application/json')
        self.assertEqual(response.status_code, 404)
        json_response = json.loads(response.data.decode())
        self.assertEqual(json_response['error'], 'Not Found')
        # Ensure this matches the consistent message in app.py
        self.assertEqual(json_response['message'], 'No portfolio data submitted yet. Please use POST /portfolio/submit first.')

    def test_rebalance_portfolio_with_data_submitted(self):
        """Test /portfolio/rebalance after portfolio data has been submitted."""
        sample_payload = {'stocks': [{'ticker': 'TSLA', 'shares': 15}]}
        submit_response = self.client.post('/portfolio/submit',
                                           data=json.dumps(sample_payload),
                                           content_type='application/json')
        self.assertEqual(submit_response.status_code, 200)

        response = self.client.post('/portfolio/rebalance',
                                      data=json.dumps({'strategy': 'aggressive'}), 
                                      content_type='application/json')
        self.assertEqual(response.status_code, 200)
        json_response = json.loads(response.data.decode())
        self.assertIn('rebalancing_suggestion', json_response)
        self.assertEqual(json_response['rebalancing_suggestion'], 'pending_implementation')
        self.assertEqual(json_response['data_status'], 'Portfolio data found')

    def test_non_existent_route(self):
        """Test a non-existent route to check custom 404 handler."""
        response = self.client.get('/nonexistent-route')
        self.assertEqual(response.status_code, 404)
        json_response = json.loads(response.data.decode())
        self.assertEqual(json_response['error'], 'Not Found')
        self.assertEqual(json_response['message'], 
                         'The requested URL was not found on the server. '
                         'If you entered the URL manually please check your spelling and try again.')

if __name__ == '__main__':
    unittest.main()
