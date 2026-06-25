"""Generate a few sample invoice PDFs for OCR demo."""
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


OUT_DIR = Path(__file__).parent


SAMPLES = [
    {
        "filename": "sample_invoice_low.pdf",
        "vendor": "Acme Office Supplies",
        "invoice_number": "ACM-7721",
        "amount": 420.50,
        "due_date": "2026-07-15",
        "po": "PO-11223",
        "gl": "6100-Office",
    },
    {
        "filename": "sample_invoice_high.pdf",
        "vendor": "Eta Engineering",
        "invoice_number": "ETA-8842",
        "amount": 18500.00,
        "due_date": "2026-06-30",
        "po": "PO-99887",
        "gl": "6600-Professional",
    },
    {
        "filename": "sample_invoice_board.pdf",
        "vendor": "Delta Global Parts",
        "invoice_number": "DEL-9901",
        "amount": 67500.00,
        "due_date": "2026-06-20",
        "po": "PO-55443",
        "gl": "6400-COGS",
    },
]


def build_pdf(sample: dict) -> Path:
    path = OUT_DIR / sample["filename"]
    c = canvas.Canvas(str(path), pagesize=letter)
    width, height = letter

    y = height - 72
    c.setFont("Helvetica-Bold", 18)
    c.drawString(72, y, "INVOICE")

    y -= 36
    c.setFont("Helvetica", 12)
    c.drawString(72, y, f"Vendor: {sample['vendor']}")
    y -= 20
    c.drawString(72, y, f"Invoice #: {sample['invoice_number']}")
    y -= 20
    c.drawString(72, y, f"PO #: {sample['po']}")
    y -= 20
    c.drawString(72, y, f"GL Code: {sample['gl']}")
    y -= 20
    c.drawString(72, y, f"Date: 2026-05-01")
    y -= 20
    c.drawString(72, y, f"Due Date: {sample['due_date']}")

    y -= 40
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, y, "Line Items")
    y -= 24
    c.setFont("Helvetica", 12)
    c.drawString(72, y, f"Consulting services and materials")
    c.drawString(400, y, f"1")
    c.drawString(450, y, f"${sample['amount']:,.2f}")

    y -= 40
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, y, f"Total Amount Due: ${sample['amount']:,.2f}")

    c.save()
    return path


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for sample in SAMPLES:
        path = build_pdf(sample)
        print(f"Generated {path}")


if __name__ == "__main__":
    main()
