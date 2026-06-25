# Mini Peakflo — Agentic AP Workflow Prototype

A portfolio-ready, end-to-end prototype inspired by **Peakflo**'s agentic finance workflows. It ingests invoices, checks them against a small ERP-style policy knowledge base via RAG, and orchestrates lightweight agents to produce an explainable approval recommendation.

## What it does

1. **Ingests invoices** from synthetic CSV/JSON or uploaded PDFs.
2. **Extracts key fields** with OCR + LLM-driven parsing.
3. **Retrieves relevant finance policies** from a ChromaDB vector store.
4. **Orchestrates agents**:
   - Data Extraction Agent
   - Policy Check Agent (RAG-grounded)
   - Approval Recommendation Agent
   - Notification Agent (simulated)
5. **Exposes a FastAPI backend** and a **Next.js UI** to trigger workflows and inspect step-by-step traces.

## Architecture

```
Next.js UI  ──HTTP──►  FastAPI Backend
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   Invoice Store     Workflow Orchestrator   ChromaDB RAG
        │                   │
        ▼                   ▼
  Data Extraction      Policy Check
  (JSON / OCR)         (retrieve + LLM)
                              │
                              ▼
                        Approval Agent
                              │
                              ▼
                        Notification Agent
```

## Tech stack

- **Backend**: Python, FastAPI, Pydantic v2, Uvicorn
- **Agents / RAG**: LangChain, ChromaDB, `sentence-transformers/all-MiniLM-L6-v2`
- **LLM provider**: OpenAI GPT-4o-mini (optional), Ollama (optional), or deterministic rule-based fallback (default)
- **OCR**: Tesseract + `pdf2image`
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Packaging**: Docker Compose

## How this maps to Peakflo-style finance workflows

| Component | Real-world AP / P2P task |
|-----------|--------------------------|
| Data Extraction Agent | OCR and field extraction from vendor bills / invoices |
| Policy Check Agent | Compliance against payment terms, approval thresholds, vendor risk policies |
| Approval Recommendation Agent | Auto-approve, hold, or escalate based on rules and risk signals |
| Notification Agent | Alerts to AP clerks, managers, or vendors via email/ERP API |
| Workflow Orchestrator | End-to-end procure-to-pay visibility and audit trail |
| RAG Layer | Grounding decisions in dynamic ERP/finance policy knowledge |

## Quick start

```bash
# 1. Clone / enter the repo
cd peakflo-agentic-workflow

# 2. Optional: set an LLM provider (otherwise a deterministic fallback runs)
cp .env.example .env
# edit .env with OPENAI_API_KEY or OLLAMA_MODEL if desired

# 3. Run everything
docker-compose up --build

# 4. Open the UI at http://localhost:3000
# 5. Backend docs at http://localhost:8000/docs
```

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Example API flow

```bash
# Seed synthetic invoices
curl -X POST http://localhost:8000/invoices/ingest

# List invoices
curl http://localhost:8000/invoices

# Run workflow on invoice INV-001
curl -X POST http://localhost:8000/workflow/run \
  -H "Content-Type: application/json" \
  -d '{"invoice_id": "INV-001"}'

# Get full trace
curl http://localhost:8000/workflow/trace/<run_id>
```

## Demo script

1. Open the UI at `http://localhost:3000`.
2. Select a synthetic invoice (e.g., a high-dollar vendor bill).
3. Click **Run Agentic Workflow**.
4. Narrate each step in the trace:
   - Extraction: "Here the agent pulls vendor, amount, due date, PO, GL code."
   - Policy check: "RAG retrieves the approval threshold and vendor risk policy."
   - Recommendation: "Because the amount is over $10k and the vendor has a risk flag, the system escalates."
   - Notification: "A simulated email is queued to the CFO."
5. Upload a sample PDF invoice and show OCR → extraction → workflow.

## Project structure

See the architecture diagram and the `backend/`, `frontend/`, and `data/` directories.

## License

MIT — synthetic data only, no real PII.
