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
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Next.js Frontend                                │
│  Invoice selector / upload  →  "Run Workflow"  →  Step-by-step trace viewer  │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                          FastAPI Backend (Python)                            │
│  • /invoices/ingest      • /workflow/run      • /workflow/status/{run_id}   │
│  • /invoices/{id}        • /policies/search   • /workflow/trace/{run_id}    │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼──────┐    ┌──────────▼──────────┐   ┌───────▼───────┐
│  In-Memory   │    │   Workflow          │   │  ChromaDB     │
│  Invoice     │    │   Orchestrator      │   │  Vector Store │
│  Store       │    │   (sequential)      │   │  (RAG)        │
└──────────────┘    └──────────┬──────────┘   └───────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
┌─────────▼─────────┐ ┌────────▼─────────┐ ┌────────▼──────────┐
│ Data Extraction   │ │ Policy Check     │ │ Approval          │
│ Agent             │ │ Agent (RAG)      │ │ Recommendation    │
│ - JSON parser     │ │ - Chroma retrieve│ │ Agent             │
│ - OCR (Tesseract) │ │ - LLM grounded   │ │ - decision + why  │
└───────────────────┘ └──────────────────┘ └───────────────────┘
                                                    │
                                           ┌────────▼──────────┐
                                           │ Notification Agent│
                                           │ (simulated email) │
                                           └───────────────────┘
```

## Tech stack

- **Backend**: Python 3.11+, FastAPI, Pydantic v2, Uvicorn
- **Agents / RAG**: LangChain, ChromaDB, `sentence-transformers/all-MiniLM-L6-v2`
- **LLM provider**: OpenAI GPT-4o-mini (optional), Ollama (optional), or deterministic rule-based fallback (default)
- **OCR**: Tesseract + `pdf2image`
- **Frontend**: Next.js 15, React, Tailwind CSS
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

## Quick start (Docker Compose)

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

> **Note for macOS users**: the OCR path uses `pdf2image`, which requires Poppler. If you run the backend outside Docker, install it with `brew install poppler tesseract`.

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

# Run workflow on invoice INV-002 (high-risk, high-value)
curl -X POST http://localhost:8000/workflow/run \
  -H "Content-Type: application/json" \
  -d '{"invoice_id": "INV-002"}'

# Get full trace
curl http://localhost:8000/workflow/trace/<run_id>

# Upload a PDF invoice for OCR + workflow
curl -X POST http://localhost:8000/invoices/upload \
  -F "file=@data/sample_pdfs/sample_invoice_high.pdf"
```

## Project structure

```
peakflo-agentic-workflow/
├── README.md
├── docker-compose.yml
├── backend/              # FastAPI app, agents, RAG, tests
├── frontend/             # Next.js dashboard
└── data/                 # Synthetic invoices, policy KB, sample PDFs
```

## Demo script

1. Open the UI at `http://localhost:3000`.
2. Select a synthetic invoice (e.g., **INV-002** — high-risk vendor, $27k).
3. Click **Run Agentic Workflow**.
4. Narrate each step in the trace:
   - Extraction: "Here the agent pulls vendor, amount, due date, PO, GL code."
   - Policy check: "RAG retrieves the approval threshold and vendor risk policy."
   - Recommendation: "Because the amount is over $10k and the vendor is high-risk, the system escalates."
   - Notification: "A simulated email is queued to the CFO."
5. Upload a sample PDF invoice and show OCR → extraction → workflow.

## Running tests

```bash
cd backend
source venv/bin/activate
pytest tests -v
```

## License

MIT — synthetic data only, no real PII.
