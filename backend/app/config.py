"""Application settings."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent.parent

DATA_DIR = ROOT / "data"
INVOICES_DIR = DATA_DIR / "invoices"
POLICIES_DIR = DATA_DIR / "policies"
SAMPLE_PDFS_DIR = DATA_DIR / "sample_pdfs"
CHROMA_DIR = Path(os.getenv("CHROMA_DIR", str(DATA_DIR / "chroma")))

BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", "3000"))

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")

REBUILD_INDEX = os.getenv("REBUILD_INDEX", "false").lower() in ("true", "1", "yes")

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_LLM = "gpt-4o-mini"
