"""Swappable LLM provider with rule-based fallback."""
from typing import TypeVar

from langchain_core.language_models import BaseChatModel
from pydantic import BaseModel

from app.config import DEFAULT_LLM, OLLAMA_MODEL, OPENAI_API_KEY
from app.llm.fallback import rule_based_policy_check, rule_based_recommendation

T = TypeVar("T", bound=BaseModel)


def get_llm() -> BaseChatModel | None:
    """Return a LangChain chat model based on env configuration, or None for fallback."""
    if OPENAI_API_KEY:
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(model=DEFAULT_LLM, temperature=0)

    if OLLAMA_MODEL:
        from langchain_ollama import ChatOllama

        return ChatOllama(model=OLLAMA_MODEL, temperature=0)

    return None


def generate_structured(prompt: str, schema: type[T], invoice_context: dict | None = None) -> T:
    """Generate a structured response, using a real LLM when configured or deterministic rules otherwise."""
    # Heuristic: route by prompt intent because the fallback is not a generic LLM.
    llm = get_llm()

    if llm is None:
        return _rule_based(schema, invoice_context or {})

    structured = llm.with_structured_output(schema)
    return structured.invoke(prompt)  # type: ignore[return-value]


def _rule_based(schema: type[T], context: dict) -> T:
    if schema.__name__ == "PolicyCheckResult":
        result = rule_based_policy_check(context)
    elif schema.__name__ == "ApprovalRecommendation":
        result = rule_based_recommendation(context)
    else:
        # Generic fallback: return default instance
        result = {}
    return schema(**result)
