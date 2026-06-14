# CSV Analysis: `Expenses Export.csv`

## Overview
A row-by-row analysis of the provided CSV file to inform import policies and anomaly detection rules.

## Detected Anomalies

| Row | Description / Issue | Category | Severity | Auto-fixable? | Recommended Policy |
|-----|---------------------|----------|----------|---------------|--------------------|
| 5,6 | **Near-Duplicate Expenses:** Row 5 ("Dinner at Marina Bites", Dev, 3200) and Row 6 ("dinner - marina bites") are identical in data except case/notes. | Duplicate | High | No (Review) | Flag as **Near Duplicate**. Never auto-delete. Mark PENDING_REVIEW. |
| 7 | **Invalid Numeric Format:** Amount is `"1,200"` (contains comma). | Amount | Low | Yes | Auto-strip commas from amount string before parsing to `Decimal`. |
| 9 | **Case Insensitivity / Aliasing:** Payer is `priya` (lowercase) instead of `Priya`. | Participant | Low | Yes | Auto-capitalize or use case-insensitive matching against group member names. |
| 10 | **Precision Issues:** Amount is `899.995`. | Amount | Low | Yes | Auto-round to 2 decimal places using standard financial rounding logic. |
| 11 | **Unknown User:** Payer is `Priya S`. | Participant | Medium | No (Review) | Support mapping, creation, or exclusion during import review. |
| 13 | **Missing Payer:** Payer column is blank for "House cleaning supplies". | Participant | High | No (Review) | Do not import into Expense table. Hold in ImportSession pending review. |
| 14 | **Settlement Disguised:** "Rohan paid Aisha back", amount 5000. Missing `split_type`. | Settlement | Medium | No (Review) | Recommend conversion to a Settlement entity between Rohan and Aisha. |
| 15 | **Invalid Percentage Totals:** "Pizza Friday" percentages add up to 110% (30+30+30+20). | Split | High | No (Review) | Block import until resolved. |
| 20,21,23,26 | **Foreign Currency:** Expenses are in `USD`. | Currency | Medium | No (Review) | Store originalAmount, originalCurrency, exchangeRate, convertedAmount. Exchange rate selected during import session. |
| 23 | **Unknown User:** "Dev's friend Kabir" included in split. | Participant | Medium | No (Review) | Support mapping, creation, or exclusion. |
| 24,25 | **Conflicting Duplicates:** Row 24 (Aisha, 2400) and Row 25 (Rohan, 2450) claim to pay for the same dinner. | Duplicate | High | No (Review) | Create CONFLICTING_DUPLICATE anomaly. Require manual review. |
| 26 | **Negative Amount:** "Parasailing refund" has amount `-30`. | Amount | High | Yes (with Flag) | Treat as potential refund. Auto-import but flag anomaly. |
| 27 | **Mixed Date Format / Trailing spaces:** Date is `Mar-14` instead of `DD-MM-YYYY`. Payer is `rohan `. | Date / Participant | Medium | Yes | Use robust date parsing. Auto-trim whitespace from all string fields. |
| 28 | **Missing Currency:** "Groceries DMart" currency is blank. | Currency | Low | Yes | Auto-fill missing currency with group's default currency (`INR`). |
| 31 | **Zero Amount:** "Dinner order Swiggy" amount is `0`. | Amount | Medium | No (Review) | Require manual review. |
| 32 | **Invalid Percentage Totals:** Repeated error, adds up to 110%. | Split | High | No (Review) | Block import until resolved. |
| 34 | **Ambiguous Date Format:** `04-05-2026`. Could be April 5 or May 4. | Date | Medium | No (Review) | Never auto-guess. Require review. |
| 36 | **Inactive Member:** Meera included in April groceries, but she moved out in late March. | Membership | High | No (Review) | Flag as **Member Inactive**. Prompt user to remove her from the split and recalculate. |
| 38 | **Deposit/Settlement:** "Sam deposit share" paid to Aisha. | Settlement | Medium | No (Review) | Convert to a **Settlement** from Sam to Aisha. |
| 42 | **Split Type Mismatch:** `split_type` is `equal`, but `split_details` has individual shares. | Split | Low | No (Review) | Create SPLIT_CONFLICT anomaly. Require manual review. |

## Key Learnings for Import Engine
1. **Never trust raw strings**: We must apply `.trim()`, `.toLowerCase()` for lookups, and robust regex to strip commas from numbers.
2. **Date parsing is critical**: We cannot rely on standard `new Date()`. We need a strict parser (like `date-fns` `parse`) trying multiple formats (`dd-MM-yyyy`, `MMM-dd`, etc.).
3. **Memberships are temporal**: The Meera/Sam timeline proves `joinedAt` and `leftAt` constraints are strictly required during CSV import evaluation.
4. **Duplicates aren't always exact**: Case differences (Row 5 vs 6) and conflicting disputes (Row 24 vs 25) require manual user review. Silently overwriting is dangerous.
