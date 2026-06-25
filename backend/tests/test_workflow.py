"""Smoke tests for invoice ingestion, RAG, and the agentic workflow."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.rag.store import retrieve_policies
from app.services.invoice_store import get_invoice, seed_invoices


@pytest.fixture(scope="module")
def client():
    seed_invoices()
    return TestClient(app)


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_ingest(client):
    res = client.post("/invoices/ingest")
    assert res.status_code == 200
    invoices = res.json()
    assert len(invoices) >= 30


def test_list_invoices(client):
    res = client.get("/invoices")
    assert res.status_code == 200
    assert any(inv["id"] == "INV-001" for inv in res.json())


def test_get_invoice(client):
    res = client.get("/invoices/INV-001")
    assert res.status_code == 200
    assert res.json()["id"] == "INV-001"


def test_rag_retrieval():
    seed_invoices()
    inv = get_invoice("INV-002")
    policies = retrieve_policies(inv, k=3)
    assert len(policies) > 0
    sources = {p.source for p in policies}
    assert "approval_thresholds" in sources or "vendor_risk_flags" in sources


def test_workflow_run(client):
    res = client.post("/workflow/run", json={"invoice_id": "INV-001"})
    assert res.status_code == 200
    run = res.json()
    assert run["status"] == "completed"
    assert len(run["steps"]) == 4
    assert run["recommendation"]["decision"] in ("APPROVE", "HOLD", "ESCALATE")


def test_workflow_trace(client):
    run_res = client.post("/workflow/run", json={"invoice_id": "INV-003"})
    run_id = run_res.json()["run_id"]
    res = client.get(f"/workflow/trace/{run_id}")
    assert res.status_code == 200
    assert res.json()["run_id"] == run_id
