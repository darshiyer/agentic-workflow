"""Workflow run endpoints."""
from fastapi import APIRouter, HTTPException

from app.agents.orchestrator import WorkflowOrchestrator
from app.models import RunWorkflowRequest, WorkflowRun
from app.services import invoice_store

router = APIRouter(prefix="/workflow", tags=["workflow"])

_orchestrator = WorkflowOrchestrator()
_trace_store: dict[str, WorkflowRun] = {}


@router.post("/run", response_model=WorkflowRun)
def run_workflow(request: RunWorkflowRequest) -> WorkflowRun:
    invoice = invoice_store.get_invoice(request.invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice {request.invoice_id} not found")

    run = _orchestrator.run(invoice)
    _trace_store[run.run_id] = run
    return run


@router.get("/status/{run_id}", response_model=WorkflowRun)
def get_status(run_id: str) -> WorkflowRun:
    run = _trace_store.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    return run


@router.get("/trace/{run_id}", response_model=WorkflowRun)
def get_trace(run_id: str) -> WorkflowRun:
    run = _trace_store.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    return run
