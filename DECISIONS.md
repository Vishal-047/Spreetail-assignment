# DECISIONS.md

## Decision 1: Monetary Precision (Decimal vs Float)

### Context

The CSV includes monetary values with fractional precision (e.g., 899.995, Row 10). Accurate arithmetic is required for splits, settlements, and reporting.

### Options Considered

- Use floating-point types (`float`/`double`).
- Use integer cents (store minor units as integers).
- Use arbitrary-precision decimal types (`Decimal` in app logic, `DECIMAL` in DB).

### Decision

Adopt arbitrary-precision decimals: use `decimal.js` (or equivalent) in application logic and `DECIMAL` in PostgreSQL.

### Rationale

- Floating-point types produce rounding errors that can materially alter balances (technical constraint and CSV evidence).
- Integer cents complicate share and percentage calculations yielding rounding edge cases relevant to product requirements.
- Decimal preserves exact values and supports defensible audit trails.

---

## Decision 2: Membership Timeline Tracking (joinedAt / leftAt)

### Context

Imported data shows users included in expenses before joining or after leaving the group (Meera Row 36; Sam Row 38). The product must prevent retroactive or future charges and preserve historical correctness.

### Options Considered

- No temporal tracking (use current membership state only).
- Add `joinedAt` / `leftAt` timestamps to `GroupMember`.
- Implement a full event-sourced membership ledger.

### Decision

Store `joinedAt` and `leftAt` timestamps on `GroupMember` and validate participant membership against these timestamps at import and calculation time.

### Rationale

- No temporal data fails to detect membership-timeline anomalies from the CSV (product requirement).
- Event sourcing adds complexity and operational cost without clear benefit for current requirements (technical constraint).
- Timestamp bounds meet the audit and validation needs with minimal complexity.

---

## Decision 3: Separate Expense and Settlement Entities

### Context

Some CSV rows represent transfers/repayments rather than shared expenses (e.g., Row 14, Row 38). The semantics and downstream calculations differ between expenses and settlements.

### Options Considered

- Single `Transaction` table with a `type` flag.
- Distinct `Expense` and `Settlement` entities with separate business rules.

### Decision

Use distinct `Expense` and `Settlement` entities in the schema and service layer.

### Rationale

- A unified table complicates split-type validation and reporting and risks mixing accounting semantics (technical constraint demonstrated by CSV rows).
- Separate entities keep calculation logic scoped, simplify queries, and make intent explicit for UI and reports (product requirement).

---

## Decision 4: Immutable Import Records and Import Review Workflow

### Context

CSV imports contain near duplicates, conflicting duplicates, missing fields, and invalid splits (Rows 5–6, 24–25, 13, 15, 32). We must preserve original inputs for audit and enable deterministic review.

### Options Considered

- Normalize/overwrite inputs and write final domain rows only.
- Discard original inputs after transformation.
- Persist raw uploaded rows as `ImportRecord` JSON, record `ImportAnomaly` entries, and resolve via `ImportSession` manual workflow.

### Decision

Persist raw uploaded rows as `ImportRecord` JSON, persist `ImportAnomaly` records for detected issues, and require manual resolution in an `ImportSession` before producing `Expense` or `Settlement` rows.

### Rationale

- Discarding originals removes provenance and prevents accurate conflict resolution (audit/product requirement).
- Persisting raw rows and anomalies enables reproducible reviews, preserves evidence for disputes, and satisfies auditability constraints.

---

## Decision 5: Support for `SHARES` Split Type

### Context

CSV contains share-based splits (e.g., Row 22, Row 35) where ratios do not convert cleanly to finite percentages and can cause rounding drift.

### Options Considered

- Convert shares to percentages and store percentages.
- Support shares natively and compute amounts at calculation time.

### Decision

Implement a native `SHARES` split type, store integer share counts per participant, and derive participant amounts deterministically.

### Rationale

- Converting shares to percentages introduces rounding error that affects fairness and balances (CSV evidence and product requirement).
- Native shares maintain proportional correctness and minimize rounding propagation.

---

## Decision 6: Duplicate Expense Handling

### Context

The dataset includes near duplicates and conflicting duplicates (Rows 5–6, 24–25). Stakeholders require explicit approval before altering or removing imported records.

### Options Considered

- Auto-delete or auto-merge duplicates.
- Keep all duplicates as-is with no review.
- Surface duplicates as anomalies and require manual resolution.

### Decision

Surface duplicate findings as `ImportAnomaly` entries (`NEAR_DUPLICATE`, `CONFLICTING_DUPLICATE`) and require manual resolution in the `ImportSession` workflow before any deletion or canonicalization.

### Rationale

- Automatic deletion risks data loss and mis-reconciliation (product requirement).
- Leaving duplicates without review leaves inconsistent data.
- Manual review preserves auditability and aligns with stakeholder expectations.

---

## Decision 7: Currency Conversion Strategy

### Context

Imported rows use multiple currencies (INR and USD, Rows 20, 21, 23, 26). Group reporting requires a consistent currency while preserving original input values.

### Options Considered

- Convert amounts immediately and discard originals.
- Store originals and converted values with the exchange rate used.
- Use live FX rates to convert and update historical records automatically.

### Decision

Store `originalAmount` and `originalCurrency` with `exchangeRate` and `convertedAmount` where conversion is applied; conversion rate is chosen during the import session.

### Rationale

- Discarding originals undermines auditability.
- Live FX is out of scope and introduces volatility (project constraint).
- Storing both values preserves provenance and supports correct reconciliation.

---

## Decision 8: Ambiguous Dates

### Context

Some date strings in the CSV are ambiguous and can be parsed in multiple valid ways (e.g., Row 34). Incorrect parsing changes ordering and financial reporting windows.

### Options Considered

- Assume a default date format.
- Apply heuristics to guess the intended format.
- Flag ambiguous dates and require user correction.

### Decision

Flag ambiguous dates as `AMBIGUOUS_DATE` anomalies and require user review and correction in the `ImportSession` workflow.

### Rationale

- Defaulting or guessing can misdate financial records (audit risk).
- Manual correction is explicit and defensible for financial recordkeeping.

---

## Decision 9: Missing Payers

### Context

Some imported rows lack payer information (Row 13). Payer attribution is required to compute net balances correctly.

### Options Considered

- Guess payer using heuristics.
- Assign a system default payer.
- Block import and require manual resolution.

### Decision

Block import of records missing a payer and surface them for manual resolution in the `ImportSession`.

### Rationale

- Heuristics or defaults may produce incorrect balances and undermine user trust (product requirement).
- Manual resolution ensures explicit, auditable payer attribution before creating domain records.

---
