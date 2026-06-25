"""Shared types for agents and workflow traces."""
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class AgentStep(BaseModel):
    agent: str
    status: str  # running | success | error
    input_summary: str
    output_summary: str
    details: dict[str, Any] = Field(default_factory=dict)
    started_at: str
    completed_at: str | None = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
