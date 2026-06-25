"""Data Extraction Agent: normalize invoice JSON or OCR output into Invoice schema."""
import json
from datetime import datetime

from app.agents.base import AgentStep, now_iso
from app.models import Invoice


class DataExtractionAgent:
    def run(self, invoice: Invoice) -> tuple[Invoice, AgentStep]:
        started = now_iso()
        # For JSON ingestion, the invoice is already structured.
        # This agent is the seam for OCR-derived or API-derived raw text.
        invoice.status = "extracted"
        summary = (
            f"Vendor: {invoice.vendor_name}, Amount: {invoice.amount} {invoice.currency}, "
            f"Due: {invoice.due_date}, PO: {invoice.po_number}, GL: {invoice.gl_code}"
        )
        step = AgentStep(
            agent="DataExtractionAgent",
            status="success",
            input_summary=f"invoice_id={invoice.id}",
            output_summary=summary,
            details={
                "vendor_name": invoice.vendor_name,
                "invoice_number": invoice.invoice_number,
                "amount": invoice.amount,
                "currency": invoice.currency,
                "due_date": invoice.due_date,
                "po_number": invoice.po_number,
                "gl_code": invoice.gl_code,
                "risk_flags": invoice.risk_flags,
                "line_items": [json.loads(li.model_dump_json()) for li in invoice.line_items],
            },
            started_at=started,
            completed_at=now_iso(),
        )
        return invoice, step
