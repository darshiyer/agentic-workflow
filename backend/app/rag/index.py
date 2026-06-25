"""Build and persist the ChromaDB index over finance policies."""
from pathlib import Path

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from app.config import CHROMA_DIR, EMBEDDING_MODEL, REBUILD_INDEX
from app.rag.loader import load_policies
from app.models import PolicyChunk

_embeddings: HuggingFaceEmbeddings | None = None
_vector_store: Chroma | None = None


def get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def ensure_index() -> Chroma:
    """Load existing Chroma index or build it from policy files."""
    global _vector_store
    if _vector_store is not None:
        return _vector_store

    chroma_dir = Path(CHROMA_DIR)
    if REBUILD_INDEX and chroma_dir.exists():
        import shutil

        shutil.rmtree(chroma_dir)

    if chroma_dir.exists() and any(chroma_dir.iterdir()):
        _vector_store = Chroma(
            persist_directory=str(chroma_dir),
            embedding_function=get_embeddings(),
        )
        return _vector_store

    policies = load_policies()
    texts = [p.content for p in policies]
    metadatas = [{"source": p.source, "category": p.category or p.source} for p in policies]

    chroma_dir.mkdir(parents=True, exist_ok=True)
    _vector_store = Chroma.from_texts(
        texts=texts,
        metadatas=metadatas,
        embedding=get_embeddings(),
        persist_directory=str(chroma_dir),
    )
    return _vector_store


def get_vector_store() -> Chroma:
    if _vector_store is None:
        return ensure_index()
    return _vector_store
