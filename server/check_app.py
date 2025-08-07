"""
Simple script to test that the Flask app is running correctly.
"""

from app import app

if __name__ == '__main__':
    print("Flask app is initialized correctly.")
    print(f"App name: {app.name}")
    print(f"Routes defined: {len(app.url_map._rules)}")
    print("Available routes:")
    for rule in app.url_map.iter_rules():
        print(f" - {rule.endpoint}: {rule.methods} {rule.rule}")
    print("\nApp is ready to run.")
