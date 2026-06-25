"""Invoice ingestion and listing endpoints."""
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models import Invoice, UploadResponse
from app.services import invoice_store
from app.services.ocr import extract_invoice_from_pdf

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("/ingest", response_model=list[Invoice])
def ingest_invoices() -> list[Invoice]:
    """Seed the in-memory store with synthetic invoices."""
    return invoice_store.seed_invoices()


@router.get("", response_model=list[Invoice])
def list_invoices() -> list[Invoice]:
    return invoice_store.list_invoices()


@router.get("/{invoice_id}", response_model=Invoice)
def get_invoice(invoice_id: str) -> Invoice:
    invoice = invoice_store.get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
    return invoice


@router.post("/upload", response_model=UploadResponse)
async def upload_invoice(file: UploadFile = File(...)) -> UploadResponse:
    """Upload a PDF invoice, run OCR + extraction, and store it."""
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()
    try:
        invoice = extract_invoice_from_pdf(contents)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {exc}") from exc

    invoice_store.save_invoice(invoice)
    return UploadResponse(invoice_id=invoice.id, message="Invoice extracted and stored", extracted=invoice)
