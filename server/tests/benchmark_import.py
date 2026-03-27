import os
import sys
import uuid
import time
import io
import csv
from datetime import date
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.persistence.tables import Base, Portfolio, User, Holding
from app.domain.services import holding_service

# Setup in-memory sqlite for benchmark
engine = create_engine('sqlite:///:memory:', echo=False)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

def generate_csv_data(rows):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["symbol", "quantity", "average_cost", "target_allocation", "purchase_date"])
    for i in range(rows):
        writer.writerow([f"SYM{i}", "10", "150.0", "5.0", "2023-01-01"])
    return output.getvalue()

def benchmark_import(num_rows):
    db = Session()
    email = f"test_{num_rows}@example.com"
    user = User(email=email, hashed_password="pw", id=uuid.uuid4())
    db.add(user)
    portfolio = Portfolio(id=uuid.uuid4(), user_id=user.id, name="Test Portfolio")
    db.add(portfolio)
    db.commit()

    csv_data = generate_csv_data(num_rows)
    reader = csv.DictReader(io.StringIO(csv_data))

    start_time = time.time()

    valid_rows = []
    for row in reader:
        symbol = row["symbol"]
        quantity = Decimal(row["quantity"])
        price = Decimal(row["average_cost"])
        purchase_date = date.fromisoformat(row["purchase_date"])
        target_alloc = Decimal(row["target_allocation"])

        valid_rows.append({
            "symbol": symbol,
            "quantity": quantity,
            "purchase_price": price,
            "purchase_date": purchase_date,
            "target_allocation": target_alloc,
        })

    holding_service.add_or_update_holdings_bulk(
        db, str(user.id), portfolio.id, valid_rows
    )

    db.commit()
    end_time = time.time()

    print(f"Importing {num_rows} rows took {end_time - start_time:.4f} seconds")
    db.close()

if __name__ == "__main__":
    benchmark_import(100)
    benchmark_import(1000)
    benchmark_import(5000)
