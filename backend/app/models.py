"""Pydantic schemas for invoices, policies, and workflow traces."""
from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class InvoiceLineItem(BaseModel):
    description: str
    quantity: int
    unit_price: float
    amount: float


class Invoice(BaseModel):
    id: str
    vendor_name: str
    vendor_risk: Literal["low", "medium", "high"] = "low"
    vendor_country: str = "US"
    invoice_number: str
    amount: float
    currency: str
    invoice_date: str
    due_date: str
    po_number: str
    gl_code: str
    status: Literal["unprocessed", "extracted", "policy_checked", "approved", "held", "escalated"] = "unprocessed"
    risk_flags: list[str] = Field(default_factory=list)
    line_items: list[InvoiceLineItem] = Field(default_factory=list)
    raw_text: str | None = None  # populated by OCR path


class PolicyChunk(BaseModel):
    source: str
    content: str
    category: str | None = None


class PolicyCheckResult(BaseModel):
    compliant: bool
    violations: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    retrieved_policies: list[PolicyChunk] = Field(default_factory=list)
    explanation: str


class ApprovalDecision(str, Enum):
    APPROVE = "APPROVE"
    HOLD = "HOLD"
    ESCALATE = "ESCALATE"


class ApprovalRecommendation(BaseModel):
    decision: ApprovalDecision
    reason: str
    approver_level: str | None = None
    required_actions: list[str] = Field(default_factory=list)


class NotificationPayload(BaseModel):
    channel: Literal["email", "slack", "erp_api"]
    recipient: str
    subject: str
    body: str
    sent_at: str | None = None


class AgentStep(BaseModel):
    agent: str
    status: Literal["running", "success", "error"]
    input_summary: str
    output_summary: str
    details: dict[str, Any] = Field(default_factory=dict)
    started_at: str
    completed_at: str | None = None


class WorkflowRun(BaseModel):
    run_id: str
    invoice_id: str
    status: Literal["running", "completed", "failed"]
    steps: list[AgentStep] = Field(default_factory=list)
    extracted_invoice: Invoice | None = None
    policy_result: PolicyCheckResult | None = None
    recommendation: ApprovalRecommendation | None = None
    notification: NotificationPayload | None = None
    created_at: str
    completed_at: str | None = None


class RunWorkflowRequest(BaseModel):
    invoice_id: str


class UploadResponse(BaseModel):
    invoice_id: str
    message: str
    extracted: Invoice
