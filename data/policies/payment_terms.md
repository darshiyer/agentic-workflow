# Payment Terms Policy

## Standard terms
- All vendor invoices are expected to be paid on Net 30 terms unless a separate contract is on file.
- Invoices dated more than 90 days past their due date are considered stale and must be escalated before payment.

## High-risk vendor terms
- Vendors flagged as high-risk must be paid on Net 15 terms or less to limit exposure.
- High-risk vendors include those located in sanctioned regions, those with a tax ID mismatch, or new vendors without an established payment history.

## Early payment discounts
- If a vendor offers a 2/10 Net 30 discount (2% discount if paid within 10 days), the system should recommend early payment when cash flow allows.
- Discounts must be recorded against the appropriate GL code.

## Currency handling
- Invoices in non-USD currency must be converted to USD using the daily FX rate before approval routing.
- FX gains/losses are booked to GL code 8100-FX.
