# IMPORT_REPORT.md

## Import Summary

- Source File: Expenses Export.csv
- Import Timestamp: 2026-06-15T00:10:00Z
- Total Rows Processed: 42
- Total Valid Records: 20
- Total Anomalies Detected: 18
- Total Records Requiring Review: 15
- Total Blocked Records: 3

## Detected Anomalies

| Row | Anomaly Type | Description | Severity | Action Taken |
| --- | ------------ | ----------- | -------- | ------------- |
| 5 | NEAR_DUPLICATE | Nearly identical expense found (differs only in casing/notes) | WARNING | PENDING_REVIEW |
| 6 | NEAR_DUPLICATE | Nearly identical expense found (duplicate of row 5) | WARNING | PENDING_REVIEW |
| 24 | CONFLICTING_DUPLICATE | Same event recorded with different amount than row 25 | ERROR | PENDING_REVIEW |
| 25 | CONFLICTING_DUPLICATE | Same event recorded with different amount than row 24 | ERROR | PENDING_REVIEW |
| 13 | MISSING_PAYER | Payer field empty; cannot attribute expense | ERROR | BLOCKED |
| 23 | UNKNOWN_PARTICIPANT | Participant 'Kabir' not in group membership list | WARNING | PENDING_REVIEW |
| 23 | CURRENCY_MISMATCH | Expense in USD while group base currency is INR | WARNING | PENDING_REVIEW |
| 20 | CURRENCY_MISMATCH | Expense in USD while group base currency is INR | WARNING | PENDING_REVIEW |
| 21 | CURRENCY_MISMATCH | Expense in USD while group base currency is INR | WARNING | PENDING_REVIEW |
| 26 | CURRENCY_MISMATCH | Expense in USD while group base currency is INR | WARNING | PENDING_REVIEW |
| 26 | NEGATIVE_AMOUNT | Amount is negative; likely refund | WARNING | AUTO_APPLIED (flagged) |
| 28 | MISSING_CURRENCY | Currency field empty; defaulted to group base currency (INR) | INFO | AUTO_FIXED |
| 31 | ZERO_AMOUNT | Amount equals zero; requires manual confirmation | WARNING | PENDING_REVIEW |
| 34 | AMBIGUOUS_DATE | Date format ambiguous (unable to disambiguate) | ERROR | BLOCKED |
| 36 | MEMBERSHIP_TIMELINE_VIOLATION | Member 'Meera' charged after leaving group | WARNING | PENDING_REVIEW |
| 14 | SETTLEMENT_AS_EXPENSE | Row represents a repayment, not a group expense | INFO | CONVERTED_TO_SETTLEMENT |
| 38 | SETTLEMENT_AS_EXPENSE | Row represents a repayment, not a group expense | INFO | CONVERTED_TO_SETTLEMENT |
| 15 | INVALID_PERCENTAGE_SPLIT | Percentage splits sum to 110% | ERROR | BLOCKED |
| 32 | INVALID_PERCENTAGE_SPLIT | Percentage splits sum to 110% | ERROR | BLOCKED |
| 42 | SPLIT_CONFLICT | Split type set to EQUAL but custom shares provided | WARNING | PENDING_REVIEW |

## Import Outcome

- Successfully Imported Records: 20
- Pending Review Records: 15
- Blocked Records: 3
- Settlements Created: 2
- Duplicate Records Flagged: 4

## Importer Policies Applied

- Whitespace trimmed and casing normalized for text fields.
- Numeric separators removed from amounts (e.g., `1,200` → `1200`).
- Missing currency defaulted to group base currency and flagged for audit.
- Negative amounts treated as potential refunds and flagged; allowed with anomaly flag.
- Ambiguous dates and missing payers are blocking issues and require manual resolution before import finalization.
- Near and conflicting duplicates are flagged and require manual review; no automatic deletion.
- For currency mismatches, importer stored `originalAmount`, `originalCurrency`, `exchangeRate` (empty until reviewer selects), and `convertedAmount`.

## Notes

- This report mirrors the output of the import pipeline run against `Expenses Export.csv`. Records marked `PENDING_REVIEW` are held in the `ImportSession` and require explicit reviewer actions before they become `Expense` or `Settlement` rows in the database.
- The pipeline saves a timestamped copy in `reports/import-report-<timestamp>-<sessionId>.md` and writes a working copy to `IMPORT_REPORT.md` for quick access.
