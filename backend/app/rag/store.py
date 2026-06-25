"""Retriever wrapper over the Chroma policy store."""
from app.models import Invoice, PolicyChunk
from app.rag.index import get_vector_store


def retrieve_policies(invoice: Invoice, k: int = 5) -> list[PolicyChunk]:
    """Retrieve policy chunks relevant to the given invoice."""
    query = (
        f"Approval and payment policies for invoice amount {invoice.amount} {invoice.currency} "
        f"from vendor {invoice.vendor_name} with risk flags {', '.join(invoice.risk_flags)} "
        f"due on {invoice.due_date}"
    )
    store = get_vector_store()
    docs = store.similarity_search(query, k=k)
    return [
        PolicyChunk(
            source=doc.metadata.get("source", "unknown"),
            category=doc.metadata.get("category"),
            content=doc.page_content,
        )
        for doc in docs
    ]
