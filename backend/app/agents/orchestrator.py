"""Workflow Orchestrator: run extraction → policy → approval → notification sequentially."""
import uuid
from datetime import datetime, timezone

from app.agents.approval import ApprovalRecommendationAgent
from app.agents.base import AgentStep, now_iso
from app.agents.extraction import DataExtractionAgent
from app.agents.notification import NotificationAgent
from app.agents.policy import PolicyCheckAgent
from app.models import WorkflowRun, Invoice


class WorkflowOrchestrator:
    def __init__(self) -> None:
        self.extraction_agent = DataExtractionAgent()
        self.policy_agent = PolicyCheckAgent()
        self.approval_agent = ApprovalRecommendationAgent()
        self.notification_agent = NotificationAgent()

    def run(self, invoice: Invoice) -> WorkflowRun:
        run_id = str(uuid.uuid4())[:8]
        run = WorkflowRun(
            run_id=run_id,
            invoice_id=invoice.id,
            status="running",
            created_at=now_iso(),
        )

        try:
            # Step 1: Extraction
            extracted, step = self.extraction_agent.run(invoice)
            run.steps.append(step)
            run.extracted_invoice = extracted

            # Step 2: Policy check (RAG)
            policy_result, step = self.policy_agent.run(extracted)
            run.steps.append(step)
            run.policy_result = policy_result

            # Step 3: Approval recommendation
            recommendation, step = self.approval_agent.run(extracted, policy_result)
            run.steps.append(step)
            run.recommendation = recommendation

            # Step 4: Notification
            notification, step = self.notification_agent.run(extracted, recommendation)
            run.steps.append(step)
            run.notification = notification

            run.status = "completed"
            extracted.status = recommendation.decision.value.lower()
        except Exception as exc:
            run.status = "failed"
            run.steps.append(
                AgentStep(
                    agent="WorkflowOrchestrator",
                    status="error",
                    input_summary=f"invoice_id={invoice.id}",
                    output_summary=str(exc),
                    details={"error": str(exc)},
                    started_at=now_iso(),
                    completed_at=now_iso(),
                )
            )
        finally:
            run.completed_at = now_iso()

        return run
