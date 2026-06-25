"""System metadata endpoints for showcasing backend architecture."""
from fastapi import APIRouter

from app.config import CHROMA_DIR, EMBEDDING_MODEL, OLLAMA_MODEL, OPENAI_API_KEY
from app.rag.index import get_vector_store

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/info")
def system_info() -> dict:
    """Return active tech stack configuration."""
    if OPENAI_API_KEY:
        llm_provider = "openai"
        llm_model = "gpt-4o-mini"
    elif OLLAMA_MODEL:
        llm_provider = "ollama"
        llm_model = OLLAMA_MODEL
    else:
        llm_provider = "deterministic-fallback"
        llm_model = "rule-based"

    try:
        store = get_vector_store()
        collection = store._collection
        policy_count = collection.count()
    except Exception:
        policy_count = 0

    return {
        "stack": {
            "framework": "FastAPI + Pydantic v2",
            "agent_orchestration": "Custom Python orchestrator with LangChain RAG",
            "llm_provider": llm_provider,
            "llm_model": llm_model,
            "embedding_model": EMBEDDING_MODEL,
            "vector_store": "ChromaDB",
            "vector_store_path": str(CHROMA_DIR),
            "ocr": "Tesseract + pdf2image",
        },
        "agents": [
            {"name": "DataExtractionAgent", "role": "Parse JSON or OCR-derived invoices into schema"},
            {"name": "PolicyCheckAgent", "role": "Retrieve relevant ERP policies via RAG and check compliance"},
            {"name": "ApprovalRecommendationAgent", "role": "Route invoice to APPROVE / HOLD / ESCALATE with reasoning"},
            {"name": "NotificationAgent", "role": "Simulate alerts to AP clerk, manager, or CFO"},
        ],
        "rag": {
            "indexed_policies": policy_count,
            "policy_sources": ["payment_terms", "approval_thresholds", "vendor_risk_flags"],
        },
    }
