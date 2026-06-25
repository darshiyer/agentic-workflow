# Vendor Risk Flags Policy

## Flag categories
- **high_risk_vendor**: Vendor has failed a compliance check, is in a high-risk industry, or is located in a sanctioned country.
- **tax_id_mismatch**: The tax ID on the invoice does not match the master vendor record.
- **urgent_payment**: Payment is due in 15 days or less, creating cash-flow pressure.
- **high_value**: Invoice amount is above $10,000 and requires enhanced scrutiny.
- **new_vendor**: Vendor has no prior payment history in the ERP.

## Required actions
- High-risk vendors must be reviewed by procurement before payment.
- Tax ID mismatches must be resolved with the vendor and documented before routing.
- Urgent payments should be scheduled in the next payment run.
- New vendors require onboarding checklist completion.
