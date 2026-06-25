"""OCR service: convert PDF bytes to text and heuristically parse invoice fields."""
import re
import uuid
from datetime import datetime
from io import BytesIO

from pdf2image import convert_from_bytes
from PIL import Image

try:
    import pytesseract
except ImportError:  # pragma: no cover
    pytesseract = None

from app.models import Invoice, InvoiceLineItem


def pdf_bytes_to_text(pdf_bytes: bytes) -> str:
    """Extract raw text from a PDF using pdf2image + Tesseract OCR."""
    if pytesseract is None:
        raise RuntimeError("pytesseract is not installed")

    images = convert_from_bytes(pdf_bytes, dpi=200)
    parts = []
    for image in images:
        text = pytesseract.image_to_string(image)
        parts.append(text)
    return "\n".join(parts)


def _extract_field(patterns: list[str], text: str, default: str = "") -> str:
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return default


def _extract_amount(text: str) -> float:
    patterns = [
        r"Total\s*[:$]?\s*([0-9,]+\.\d{2})",
        r"Amount\s*Due\s*[:$]?\s*([0-9,]+\.\d{2})",
        r"Amount\s*[:$]?\s*([0-9,]+\.\d{2})",
    ]
    raw = _extract_field(patterns, text, "0.00")
    return float(raw.replace(",", ""))


def _extract_date(text: str) -> str:
    patterns = [
        r"Due\s*Date\s*:?\s*(\d{4}-\d{2}-\d{2})",
        r"Due\s*Date\s*:?\s*(\d{1,2}/\d{1,2}/\d{4})",
        r"Date\s*:?\s*(\d{4}-\d{2}-\d{2})",
        r"Date\s*:?\s*(\d{1,2}/\d{1,2}/\d{4})",
    ]
    raw = _extract_field(patterns, text, datetime.now().strftime("%Y-%m-%d"))
    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return datetime.now().strftime("%Y-%m-%d")


def _extract_invoice_number(text: str) -> str:
    return _extract_field(
        [r"Invoice\s*#\s*:?\s*([A-Za-z0-9\-]+)", r"Invoice\s*Number\s*:?\s*([A-Za-z0-9\-]+)"],
        text,
        f"PDF-{uuid.uuid4().hex[:6].upper()}",
    )


def _extract_vendor(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    # Heuristic: vendor name is often the first non-empty line.
    return lines[0] if lines else "Unknown Vendor"


def _extract_po_number(text: str) -> str:
    return _extract_field([r"PO\s*#?\s*:?\s*([A-Za-z0-9\-]+)", r"Purchase\s*Order\s*:?\s*([A-Za-z0-9\-]+)"], text, "PO-UNKNOWN")


def _extract_gl_code(text: str) -> str:
    return _extract_field([r"GL\s*Code\s*:?\s*(\d{4}-[A-Za-z]+)", r"GL\s*:?\s*(\d{4}-[A-Za-z]+)"], text, "6100-Office")


def extract_invoice_from_pdf(pdf_bytes: bytes) -> Invoice:
    """Run OCR on a PDF and heuristically populate an Invoice object."""
    text = pdf_bytes_to_text(pdf_bytes)
    amount = _extract_amount(text)
    due_date = _extract_date(text)
    invoice_number = _extract_invoice_number(text)
    vendor_name = _extract_vendor(text)
    po_number = _extract_po_number(text)
    gl_code = _extract_gl_code(text)

    return Invoice(
        id=f"PDF-{uuid.uuid4().hex[:8].upper()}",
        vendor_name=vendor_name,
        vendor_risk="low",
        vendor_country="US",
        invoice_number=invoice_number,
        amount=amount,
        currency="USD",
        invoice_date=datetime.now().strftime("%Y-%m-%d"),
        due_date=due_date,
        po_number=po_number,
        gl_code=gl_code,
        status="unprocessed",
        risk_flags=["none"],
        line_items=[InvoiceLineItem(description="OCR extracted total", quantity=1, unit_price=amount, amount=amount)],
        raw_text=text,
    )
