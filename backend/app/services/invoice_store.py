"""In-memory invoice store with synthetic seed data."""
import csv
import json
from pathlib import Path

from app.config import INVOICES_DIR
from app.models import Invoice, InvoiceLineItem

_STORE: dict[str, Invoice] = {}


def _load_json(path: Path) -> list[Invoice]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return [Invoice(**item) for item in data]


def _load_csv(path: Path) -> list[Invoice]:
    invoices: list[Invoice] = []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            risk_flags = [flag.strip() for flag in row["risk_flags"].split(";") if flag.strip()]
            invoices.append(
                Invoice(
                    id=row["id"],
                    vendor_name=row["vendor_name"],
                    vendor_risk=row["vendor_risk"],  # type: ignore[arg-type]
                    vendor_country=row["vendor_country"],
                    invoice_number=row["invoice_number"],
                    amount=float(row["amount"]),
                    currency=row["currency"],
                    invoice_date=row["invoice_date"],
                    due_date=row["due_date"],
                    po_number=row["po_number"],
                    gl_code=row["gl_code"],
                    status=row["status"],  # type: ignore[arg-type]
                    risk_flags=risk_flags,
                    line_items=[InvoiceLineItem(description="Imported line", quantity=1, unit_price=float(row["amount"]), amount=float(row["amount"]))],
                )
            )
    return invoices


def seed_invoices() -> list[Invoice]:
    """Load synthetic invoices from JSON (preferred) or CSV."""
    json_path = INVOICES_DIR / "synthetic_invoices.json"
    csv_path = INVOICES_DIR / "synthetic_invoices.csv"

    if json_path.exists():
        invoices = _load_json(json_path)
    elif csv_path.exists():
        invoices = _load_csv(csv_path)
    else:
        raise FileNotFoundError("No synthetic invoice data found.")

    _STORE.clear()
    for inv in invoices:
        _STORE[inv.id] = inv
    return invoices


def get_invoice(invoice_id: str) -> Invoice | None:
    return _STORE.get(invoice_id)


def list_invoices() -> list[Invoice]:
    return list(_STORE.values())


def save_invoice(invoice: Invoice) -> None:
    _STORE[invoice.id] = invoice
