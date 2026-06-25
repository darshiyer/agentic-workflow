"""Generate synthetic invoice data for the mini Peakflo prototype."""
import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

VENDORS = [
    {"name": "Acme Office Supplies", "risk": "low", "country": "US"},
    {"name": "Beta Tech Services", "risk": "low", "country": "US"},
    {"name": "Gamma Logistics", "risk": "medium", "country": "US"},
    {"name": "Delta Global Parts", "risk": "high", "country": "IN"},
    {"name": "Epsilon Cloud LLC", "risk": "low", "country": "US"},
    {"name": "Zeta Marketing", "risk": "medium", "country": "US"},
    {"name": "Eta Engineering", "risk": "high", "country": "CN"},
    {"name": "Theta Consulting", "risk": "low", "country": "US"},
]

GL_CODES = ["6100-Office", "6200-IT", "6300-Logistics", "6400-COGS", "6500-Marketing", "6600-Professional"]
CURRENCIES = ["USD", "USD", "USD", "EUR", "USD"]  # Mostly USD


def make_invoice(i: int) -> dict:
    vendor = random.choice(VENDORS)
    amount = round(random.choice([
        random.uniform(150, 950),      # under manager threshold
        random.uniform(1200, 9500),    # manager approval band
        random.uniform(12000, 48000),  # CFO escalation band
        random.uniform(55000, 120000), # board approval band
    ]), 2)

    due_days = random.choice([7, 15, 30, 45, 60])
    invoice_date = datetime(2026, 1, 1) + timedelta(days=random.randint(0, 150))
    due_date = invoice_date + timedelta(days=due_days)

    risk_flags = []
    if vendor["risk"] == "high":
        risk_flags.append("high_risk_vendor")
    if amount > 10000:
        risk_flags.append("high_value")
    if due_days <= 15:
        risk_flags.append("urgent_payment")
    if random.random() < 0.15:
        risk_flags.append("tax_id_mismatch")
    if not risk_flags:
        risk_flags.append("none")

    line_items = []
    n_lines = random.randint(1, 3)
    remaining = amount
    for line in range(n_lines):
        is_last = line == n_lines - 1
        line_amount = round(remaining if is_last else random.uniform(10, remaining - 10), 2)
        remaining -= line_amount
        line_items.append({
            "description": f"Service or goods line {line + 1}",
            "quantity": random.randint(1, 10),
            "unit_price": round(line_amount / random.randint(1, 10), 2),
            "amount": line_amount,
        })

    return {
        "id": f"INV-{i+1:03d}",
        "vendor_name": vendor["name"],
        "vendor_risk": vendor["risk"],
        "vendor_country": vendor["country"],
        "invoice_number": f"{vendor['name'][:3].upper()}-{random.randint(1000, 9999)}",
        "amount": amount,
        "currency": random.choice(CURRENCIES),
        "invoice_date": invoice_date.strftime("%Y-%m-%d"),
        "due_date": due_date.strftime("%Y-%m-%d"),
        "po_number": f"PO-{random.randint(10000, 99999)}",
        "gl_code": random.choice(GL_CODES),
        "status": "unprocessed",
        "risk_flags": risk_flags,
        "line_items": line_items,
    }


def main() -> None:
    invoices = [make_invoice(i) for i in range(30)]
    out_dir = Path(__file__).parent

    json_path = out_dir / "synthetic_invoices.json"
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(invoices, f, indent=2)

    csv_path = out_dir / "synthetic_invoices.csv"
    flat_keys = [
        "id", "vendor_name", "vendor_risk", "vendor_country", "invoice_number",
        "amount", "currency", "invoice_date", "due_date", "po_number", "gl_code",
        "status", "risk_flags",
    ]
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=flat_keys)
        writer.writeheader()
        for inv in invoices:
            row = {k: inv[k] for k in flat_keys}
            row["risk_flags"] = ";".join(inv["risk_flags"])
            writer.writerow(row)

    print(f"Wrote {len(invoices)} invoices to {json_path} and {csv_path}")


if __name__ == "__main__":
    main()
