"""FastAPI entrypoint for the mini Peakflo backend."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_PORT
from app.routers import invoices, workflow, system
from app.services.invoice_store import seed_invoices


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed invoices and build RAG index on startup
    seed_invoices()
    from app.rag.index import ensure_index

    ensure_index()
    yield


app = FastAPI(
    title="Mini Peakflo — Agentic AP Workflow",
    description="End-to-end agentic invoice approval prototype.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(invoices.router)
app.include_router(workflow.router)
app.include_router(system.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
