"""Notification Agent: simulate sending an alert based on the workflow outcome."""
from app.agents.base import AgentStep, now_iso
from app.models import ApprovalDecision, ApprovalRecommendation, Invoice, NotificationPayload


class NotificationAgent:
    def run(
        self,
        invoice: Invoice,
        recommendation: ApprovalRecommendation,
    ) -> tuple[NotificationPayload, AgentStep]:
        started = now_iso()

        if recommendation.decision == ApprovalDecision.APPROVE:
            recipient = "ap-clerk@example.com"
            subject = f"Invoice {invoice.invoice_number} approved for payment"
            body = (
                f"Invoice {invoice.invoice_number} from {invoice.vendor_name} "
                f"for {invoice.amount} {invoice.currency} has been auto-approved."
            )
        elif recommendation.decision == ApprovalDecision.HOLD:
            recipient = f"{recommendation.approver_level or 'manager'}@example.com"
            subject = f"Invoice {invoice.invoice_number} requires review"
            body = (
                f"Invoice {invoice.invoice_number} from {invoice.vendor_name} "
                f"for {invoice.amount} {invoice.currency} is on hold. Reason: {recommendation.reason}"
            )
        else:  # ESCALATE
            recipient = "cfo@example.com"
            subject = f"Invoice {invoice.invoice_number} escalated for approval"
            body = (
                f"Invoice {invoice.invoice_number} from {invoice.vendor_name} "
                f"for {invoice.amount} {invoice.currency} has been escalated. Reason: {recommendation.reason}"
            )

        payload = NotificationPayload(
            channel="email",
            recipient=recipient,
            subject=subject,
            body=body,
            sent_at=now_iso(),
        )

        step = AgentStep(
            agent="NotificationAgent",
            status="success",
            input_summary=f"decision={recommendation.decision}",
            output_summary=f"simulated email to {recipient}",
            details=payload.model_dump(),
            started_at=started,
            completed_at=now_iso(),
        )
        return payload, step
