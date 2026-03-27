from __future__ import annotations

import csv
import io
import uuid
from decimal import Decimal, InvalidOperation
from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ...dependencies import get_db, require_user
from ...domain.services import holding_service
from ...domain.repositories import portfolio_repo
from ...domain.services.portfolio_service import ensure_owner

router = APIRouter(tags=["import_export"])


class ImportResult(BaseModel):
    imported: int
    errors: list[dict]


@router.get("/portfolios/{portfolio_id}/export")
def export_holdings(
    portfolio_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user),
):
    """Export portfolio holdings as CSV."""
    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["symbol", "quantity", "average_cost", "target_allocation", "purchase_date"])

    for h in p.holdings:
        writer.writerow([
            h.symbol,
            str(h.quantity),
            str(h.average_cost),
            str(h.target_allocation) if h.target_allocation is not None else "",
            h.first_purchase_date.isoformat() if h.first_purchase_date else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=portfolio_{portfolio_id}.csv"},
    )


@router.post("/portfolios/{portfolio_id}/import", response_model=ImportResult)
async def import_holdings(
    portfolio_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user),
):
    """Import holdings from a CSV file."""
    p = portfolio_repo.get_portfolio(db, portfolio_id)
    ensure_owner(p, user_id)

    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    errors = []

    valid_rows = []

    for row_num, row in enumerate(reader, start=2):  # start at 2 since row 1 is header
        try:
            symbol = row.get("symbol", "").strip().upper()
            if not symbol:
                errors.append({"row": row_num, "reason": "Missing symbol"})
                continue

            qty_str = row.get("quantity", "").strip()
            price_str = row.get("average_cost", row.get("purchase_price", "")).strip()

            if not qty_str or not price_str:
                errors.append({"row": row_num, "reason": f"Missing quantity or price for {symbol}"})
                continue

            quantity = Decimal(qty_str)
            price = Decimal(price_str)

            if quantity <= 0 or price <= 0:
                errors.append({"row": row_num, "reason": f"Quantity and price must be > 0 for {symbol}"})
                continue

            purchase_date = None
            date_str = row.get("purchase_date", "").strip()
            if date_str:
                try:
                    purchase_date = date.fromisoformat(date_str)
                except ValueError:
                    pass  # ignore invalid dates, not critical

            target_alloc = None
            alloc_str = row.get("target_allocation", "").strip()
            if alloc_str:
                try:
                    target_alloc = Decimal(alloc_str)
                except InvalidOperation:
                    pass

            valid_rows.append({
                "symbol": symbol,
                "quantity": quantity,
                "purchase_price": price,
                "purchase_date": purchase_date,
                "target_allocation": target_alloc,
            })

        except (InvalidOperation, ValueError) as e:
            errors.append({"row": row_num, "reason": f"Invalid data: {str(e)}"})
        except Exception as e:
            errors.append({"row": row_num, "reason": str(e)})

    if valid_rows:
        imported = holding_service.add_or_update_holdings_bulk(
            db, user_id, portfolio_id, valid_rows
        )

    return ImportResult(imported=imported, errors=errors)
