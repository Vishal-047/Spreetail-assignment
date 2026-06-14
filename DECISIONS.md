# Decision Log

## 1. Handling Multiple Payers for a Single Expense
*   **Options Considered:** 
    *   (A) Add an `expense_payments` table.
    *   (B) Move `paid_amount` into the `expense_splits` table and remove `paid_by` from `expenses`.
    *   (C) Restrict users to only one payer per expense.
*   **Decision:** Option B.
*   **Why:** This allows a normalized, single source of truth for both who owes and who paid, perfectly mimicking real-world scenarios where multiple people split a bill at checkout.

## 2. Managing Changing Flatmate Rosters
*   **Options Considered:**
    *   (A) Simple many-to-many relationship (`group_id`, `user_id`).
    *   (B) Including `joined_date` and `left_date` in the relationship table.
*   **Decision:** Option B.
*   **Why:** To accurately calculate pro-rata bills (like utilities and rent), the system needs to know exactly who was living in the house on the dates the bill covers.

## 3. Currency and Exchange Rates
*   **Options Considered:**
    *   (A) Calculate exchange rates dynamically on the fly using live APIs.
    *   (B) Store an `exchange_rate` or `base_currency_amount` at the time the expense is logged.
*   **Decision:** Option B.
*   **Why:** Historical debts should not fluctuate with the live market. The amount owed must be locked based on the rate agreed upon or active at the time of the transaction.
