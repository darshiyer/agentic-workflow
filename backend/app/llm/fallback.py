"""Deterministic rule-based policy and approval logic used when no LLM is configured."""
from datetime import datetime, timedelta

from app.models import ApprovalDecision


def rule_based_policy_check(context: dict) -> dict:
    invoice = context.get("invoice", {})
    amount = float(invoice.get("amount", 0))
    risk_flags = invoice.get("risk_flags", [])
    due_date_str = invoice.get("due_date", "")
    currency = invoice.get("currency", "USD")

    violations = []
    warnings = []

    if amount > 50000:
        violations.append("Amount exceeds $50,000 board approval threshold.")
    elif amount > 10000:
        violations.append("Amount exceeds $10,000 CFO escalation threshold.")
    elif amount > 1000:
        warnings.append("Amount exceeds $1,000 manager approval threshold.")

    if "high_risk_vendor" in risk_flags:
        violations.append("High-risk vendor requires procurement review.")
    if "tax_id_mismatch" in risk_flags:
        violations.append("Tax ID mismatch must be resolved before payment.")
    if "urgent_payment" in risk_flags:
        warnings.append("Payment is urgent (<= 15 days).")

    try:
        due = datetime.strptime(due_date_str, "%Y-%m-%d")
        if due < datetime.now() + timedelta(days=7):
            warnings.append("Due date is within 7 days.")
    except ValueError:
        pass

    if currency != "USD":
        warnings.append("Non-USD invoice requires FX conversion.")

    compliant = len(violations) == 0
    explanation = (
        "Deterministic policy check: "
        + ("no blocking violations found." if compliant else "blocking violations found.")
    )

    return {
        "compliant": compliant,
        "violations": violations,
        "warnings": warnings,
        "explanation": explanation,
        "retrieved_policies": context.get("retrieved_policies", []),
    }


def rule_based_recommendation(context: dict) -> dict:
    invoice = context.get("invoice", {})
    policy = context.get("policy", {})
    amount = float(invoice.get("amount", 0))
    violations = policy.get("violations", [])
    warnings = policy.get("warnings", [])
    risk_flags = invoice.get("risk_flags", [])

    required_actions = []

    if amount > 50000:
        decision = ApprovalDecision.ESCALATE
        approver_level = "board"
        reason = "Amount exceeds $50,000; requires board-level approval."
        required_actions.append("Submit to board for approval.")
    elif violations:
        decision = ApprovalDecision.HOLD
        approver_level = "cfo" if amount > 10000 else "ap_supervisor"
        reason = f"Policy violations require resolution before approval: {', '.join(violations)}"
        required_actions.extend(violations)
    elif amount > 10000 or "high_value" in risk_flags:
        decision = ApprovalDecision.ESCALATE
        approver_level = "cfo"
        reason = "High-value invoice requires CFO approval."
        required_actions.append("Route to CFO for approval.")
    elif amount > 1000:
        decision = ApprovalDecision.HOLD
        approver_level = "manager"
        reason = "Amount exceeds $1,000; requires manager approval."
        required_actions.append("Route to department manager.")
    else:
        decision = ApprovalDecision.APPROVE
        approver_level = "auto"
        reason = "Low amount, low risk, and no policy violations; auto-approve."

    if warnings:
        required_actions.extend(warnings)

    return {
        "decision": decision.value,
        "reason": reason,
        "approver_level": approver_level,
        "required_actions": required_actions,
    }
