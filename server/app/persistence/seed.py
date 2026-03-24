"""Seed demo account and portfolio data."""
from __future__ import annotations

from decimal import Decimal
from datetime import date
from sqlalchemy.orm import Session

from .tables import User, Portfolio, Holding
from ..auth.local_jwt import hash_password, get_user_by_email


# Demo account credentials (shown in UI)
DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "password"
DEMO_NAME = "Demo User"

# Demo portfolio holdings - a diversified tech/growth portfolio
# Each holding has different purchase dates to show portfolio growth over time
DEMO_HOLDINGS = [
    {"symbol": "AAPL", "quantity": Decimal("50"), "average_cost": Decimal("175.50"), "purchase_date": date(2025, 11, 15)},
    {"symbol": "MSFT", "quantity": Decimal("30"), "average_cost": Decimal("380.25"), "purchase_date": date(2025, 10, 1)},
    {"symbol": "GOOGL", "quantity": Decimal("20"), "average_cost": Decimal("140.75"), "purchase_date": date(2025, 12, 10)},
    {"symbol": "AMZN", "quantity": Decimal("25"), "average_cost": Decimal("178.30"), "purchase_date": date(2025, 9, 20)},
    {"symbol": "NVDA", "quantity": Decimal("15"), "average_cost": Decimal("875.00"), "purchase_date": date(2026, 1, 5)},
    {"symbol": "VOO", "quantity": Decimal("40"), "average_cost": Decimal("450.20"), "purchase_date": date(2025, 8, 1)},
    {"symbol": "BND", "quantity": Decimal("100"), "average_cost": Decimal("72.50"), "purchase_date": date(2025, 7, 15)},
]


def seed_demo_account(db: Session) -> bool:
    """
    Create demo account with portfolio if it doesn't exist.
    Returns True if created, False if already exists.
    """
    # Check if demo user already exists
    existing_user = get_user_by_email(db, DEMO_EMAIL)
    if existing_user:
        return False

    # Create demo user
    demo_user = User(
        email=DEMO_EMAIL.lower(),
        hashed_password=hash_password(DEMO_PASSWORD),
        name=DEMO_NAME,
    )
    db.add(demo_user)
    db.flush()

    # Create demo portfolio
    demo_portfolio = Portfolio(
        user_id=demo_user.id,
        name="My Portfolio",
        description="A diversified portfolio with tech stocks, index funds, and bonds.",
    )
    db.add(demo_portfolio)
    db.flush()

    # Add holdings
    for holding_data in DEMO_HOLDINGS:
        holding = Holding(
            portfolio_id=demo_portfolio.id,
            symbol=holding_data["symbol"],
            quantity=holding_data["quantity"],
            average_cost=holding_data["average_cost"],
            first_purchase_date=holding_data["purchase_date"],
        )
        db.add(holding)

    db.commit()
    return True


def ensure_demo_account(db: Session) -> None:
    """Ensure demo account exists, creating it if necessary."""
    created = seed_demo_account(db)
    if created:
        print("✓ Demo account created: demo@example.com / password")
    else:
        print("✓ Demo account already exists")
