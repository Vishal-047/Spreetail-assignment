# Project Scope

## In Scope
* **User Authentication**: Secure signup and login flow.
* **Group Management**: Creating groups, adding members, and tracking membership `joinedAt`/`leftAt` dates.
* **Expense Management**: Creating, editing, and deleting expenses.
* **Split Types**: Supporting `EQUAL`, `EXACT`, `PERCENTAGE`, and `SHARES` splits (identified from CSV).
* **Settlements**: Dedicated entity to track payments resolving debts.
* **Balance Calculation Engine**: Computing net balances per user and generating simplified debt settlement plans (Min-Cash Flow).
* **Audit Trail**: Transparent ledger explaining how each net balance was reached.
* **CSV Import System**: Robust import mechanism preserving original data.
* **Anomaly Detection Engine**: Implementing strict policies based on real-world CSV analysis.

### Importer Policies (Based on CSV Analysis)
1. **Auto-fixes**:
   - String normalization: Trim whitespace, ignore case for user matching, strip commas from numeric strings.
   - Missing currency defaults to group base currency.
   - Minor precision issues will be parsed to strict `Decimal` types.
   - Negative amounts: Treat as potential refund, auto-import but flag anomaly.
2. **Require Manual Review (Non-fatal)**:
   - Near-duplicates (never auto-delete, mark PENDING_REVIEW).
   - Conflicting duplicates (require manual review).
   - Unknown participants (support mapping, creation, or exclusion).
   - Currency mismatches (store originalAmount, originalCurrency, exchangeRate, convertedAmount; exchange rate selected during import session).
   - Suspicious descriptions indicating a disguised settlement.
   - Zero amounts (require manual review).
   - Ambiguous dates (never auto-guess, require review).
   - Split conflict (equal split with custom shares creates SPLIT_CONFLICT anomaly).
3. **Fatal / Blocking (Must be fixed to import)**:
   - Missing payers (do not import into Expense table, hold in ImportSession).
   - Invalid percentage splits (block import until resolved).
   - Including inactive users in expenses.

## Out of Scope
* **Real Payment Integrations**: No direct integrations with Stripe, PayPal, Venmo, etc. Payments are recorded manually.
* **Mobile Applications**: The application is a responsive web application, but no native iOS/Android apps will be built.
* **Automated Live FX Rates**: Real-time fetching of forex rates is not included. Users must manually supply conversion rates for USD expenses.
* **Push Notifications**: No push/email notifications for newly added expenses.

## Non-Functional Requirements
* **Architecture**: Strict separation of concerns (Service Layer handling business logic vs Route Handlers).
* **Data Integrity**: Financial amounts must be handled using exact `Decimal` types to prevent floating-point errors.
* **Auditability**: Original import data must never be altered or silently discarded.
