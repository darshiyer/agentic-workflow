"""Approval Recommendation Agent: decide APPROVE / HOLD / ESCALATE with reasons."""
from app.agents.base import AgentStep, now_iso
from app.llm.provider import generate_structured
from app.models import ApprovalRecommendation, Invoice, PolicyCheckResult


_APPROVAL_PROMPT = """You are an accounts-payable approval router. Based on the extracted invoice and the policy check result, recommend APPROVE, HOLD, or ESCALATE.

Invoice:
{invoice}

Policy check result:
{policy}

Return a structured result with:
- decision: APPROVE | HOLD | ESCALATE
- reason: concise explanation grounded in the policies
- approver_level: who should review (e.g., auto, manager, cfo, board)
- required_actions: list of next steps
"""


class ApprovalRecommendationAgent:
    def run(self, invoice: Invoice, policy: PolicyCheckResult) -> tuple[ApprovalRecommendation, AgentStep]:
        started = now_iso()

        prompt = _APPROVAL_PROMPT.format(
            invoice=invoice.model_dump_json(indent=2),
            policy=policy.model_dump_json(indent=2),
        )

        context = {
            "invoice": invoice.model_dump(),
            "policy": policy.model_dump(),
        }
        result = generate_structured(prompt, ApprovalRecommendation, context)

        step = AgentStep(
            agent="ApprovalRecommendationAgent",
            status="success",
            input_summary=f"invoice_id={invoice.id}, compliant={policy.compliant}",
            output_summary=f"decision={result.decision}, approver={result.approver_level}",
            details={
                "decision": result.decision,
                "reason": result.reason,
                "approver_level": result.approver_level,
                "required_actions": result.required_actions,
            },
            started_at=started,
            completed_at=now_iso(),
        )
        return result, step
