"""Policy Check Agent: retrieve relevant policies and produce a structured compliance result."""
from app.agents.base import AgentStep, now_iso
from app.llm.provider import generate_structured
from app.models import Invoice, PolicyCheckResult
from app.rag.store import retrieve_policies


_POLICY_PROMPT = """You are a finance policy compliance assistant. Given an invoice and relevant company policies, decide if the invoice is compliant and list any violations or warnings.

Invoice:
{invoice}

Relevant policies:
{policies}

Return a structured result with:
- compliant: boolean
- violations: list of blocking policy violations
- warnings: list of non-blocking concerns
- explanation: one-sentence summary
"""


class PolicyCheckAgent:
    def run(self, invoice: Invoice) -> tuple[PolicyCheckResult, AgentStep]:
        started = now_iso()
        retrieved = retrieve_policies(invoice, k=5)

        prompt = _POLICY_PROMPT.format(
            invoice=invoice.model_dump_json(indent=2),
            policies="\n\n".join(f"[{p.source}] {p.content}" for p in retrieved),
        )

        context = {
            "invoice": invoice.model_dump(),
            "retrieved_policies": [p.model_dump() for p in retrieved],
        }
        result = generate_structured(prompt, PolicyCheckResult, context)
        result.retrieved_policies = retrieved

        step = AgentStep(
            agent="PolicyCheckAgent",
            status="success",
            input_summary=f"invoice_id={invoice.id}",
            output_summary=(
                f"compliant={result.compliant}, "
                f"violations={len(result.violations)}, warnings={len(result.warnings)}"
            ),
            details={
                "compliant": result.compliant,
                "violations": result.violations,
                "warnings": result.warnings,
                "retrieved_policies": [p.model_dump() for p in retrieved],
                "explanation": result.explanation,
            },
            started_at=started,
            completed_at=now_iso(),
        )
        return result, step
