# SCOPE.md

# Shared Expense Management Application

## Purpose

This document defines the scope of the project, records all anomalies discovered in the provided CSV dataset, documents the chosen handling policies, and describes the database schema used by the application.

---

# In Scope

## Authentication

* User registration and login
* Session management
* Protected routes

## Group Management

* Create groups
* Add and remove members
* Track membership history
* Support changing membership over time using `joinedAt` and `leftAt`

## Expense Management

* Create expenses
* Edit expenses
* Delete expenses
* Track payer and participants
* Maintain expense history

## Supported Split Types

The application supports all split types identified in the provided CSV:

* **EQUAL**
* **EXACT**
* **PERCENTAGE**
* **SHARES**

## Settlement Management

* Record repayments between members
* Maintain settlement history
* Distinguish settlements from expenses

## Balance Calculation

* Group-level balances
* Individual balances
* Debt simplification
* Transparent audit trail

## CSV Import System

* Import CSV exactly as provided
* Preserve original imported records
* Detect anomalies
* Surface anomalies to users
* Support anomaly resolution workflow
* Generate import reports

---

# CSV Anomalies Identified

## 1. Near Duplicate Expenses

**Rows:** 5, 6

**Issue:** Same expense recorded twice with minor differences in casing and notes.

**Handling Policy:**

* Create `NEAR_DUPLICATE` anomaly
* Mark as `PENDING_REVIEW`
* Never automatically delete records

---

## 2. Conflicting Duplicate Expenses

**Rows:** 24, 25

**Issue:** Same expense recorded with different amounts.

**Handling Policy:**

* Create `CONFLICTING_DUPLICATE` anomaly
* Require manual review
* Never automatically choose a winning record

---

## 3. Missing Payer

**Row:** 13

**Issue:** Expense does not contain a payer.

**Handling Policy:**

* Block import
* Store in Import Session
* Require manual resolution

---

## 4. Unknown Participant

**Row:** 23

**Issue:** Participant **Kabir** does not exist in the group.

**Handling Policy:**

* Create new user
* Map to existing user
* Exclude participant

---

## 5. Currency Mismatch

**Rows:** 20, 21, 23, 26

**Issue:** Expenses recorded in USD while the primary group currency is INR.

**Handling Policy:**

Store:

* `originalAmount`
* `originalCurrency`
* `exchangeRate`
* `convertedAmount`

Exchange rate is selected during import.

---

## 6. Missing Currency

**Row:** 28

**Issue:** Currency field is empty.

**Handling Policy:**

* Default to group base currency
* Create anomaly record for auditing

---

## 7. Negative Amount

**Row:** 26

**Issue:** Negative expense value.

**Handling Policy:**

* Treat as potential refund
* Allow import
* Flag anomaly

---

## 8. Zero Amount Expense

**Row:** 31

**Issue:** Expense amount equals zero.

**Handling Policy:**

* Create `ZERO_AMOUNT` anomaly
* Require manual review

---

## 9. Ambiguous Date

**Row:** 34

**Issue:** Date format can be interpreted in multiple ways.

**Handling Policy:**

* Create `AMBIGUOUS_DATE` anomaly
* Require manual correction

---

## 10. Membership Timeline Violation

**Row:** 36

**Issue:** Meera is included in expenses after leaving the group.

**Handling Policy:**

* Exclude inactive members from calculations
* Flag anomaly

---

## 11. Settlement Recorded as Expense

**Rows:** 14, 38

**Issue:** Records represent repayments rather than expenses.

**Handling Policy:**

* Convert to Settlement records
* Preserve original import data

---

## 12. Invalid Percentage Split

**Rows:** 15, 32

**Issue:** Percentages total 110%.

**Handling Policy:**

* Create `INVALID_SPLIT` anomaly
* Block import until corrected

---

## 13. Split Type Conflict

**Row:** 42

**Issue:** Expense marked as equal split but contains custom share values.

**Handling Policy:**

* Create `SPLIT_CONFLICT` anomaly
* Require manual review

---

# Importer Policies

## Automatic Handling

* Trim whitespace
* Normalize casing
* Remove numeric separators (`1,200 → 1200`)
* Parse decimal values safely
* Normalize user aliases
* Flag refunds automatically

## Manual Review Required

* Near duplicates
* Conflicting duplicates
* Unknown participants
* Ambiguous dates
* Split conflicts
* Zero amount expenses

## Blocking Issues

* Missing payer
* Invalid percentage totals
* Invalid participant mappings

---

# Database Schema

## User

| Field     | Type     |
| --------- | -------- |
| id        | UUID     |
| name      | String   |
| email     | String   |
| createdAt | DateTime |

## Group

| Field     | Type     |
| --------- | -------- |
| id        | UUID     |
| name      | String   |
| createdAt | DateTime |

## GroupMember

| Field    | Type     |
| -------- | -------- |
| id       | UUID     |
| groupId  | UUID     |
| userId   | UUID     |
| joinedAt | DateTime |
| leftAt   | DateTime |

## Expense

| Field       | Type     |
| ----------- | -------- |
| id          | UUID     |
| description | String   |
| amount      | Decimal  |
| currency    | String   |
| paidBy      | UUID     |
| expenseDate | DateTime |
| splitType   | Enum     |

## Settlement

| Field          | Type     |
| -------------- | -------- |
| id             | UUID     |
| payerId        | UUID     |
| receiverId     | UUID     |
| amount         | Decimal  |
| settlementDate | DateTime |

## ImportSession

| Field      | Type     |
| ---------- | -------- |
| id         | UUID     |
| uploadedAt | DateTime |
| status     | Enum     |

## ImportRecord

| Field     | Type |
| --------- | ---- |
| id        | UUID |
| sessionId | UUID |
| rawData   | JSON |
| status    | Enum |

## ImportAnomaly

| Field       | Type   |
| ----------- | ------ |
| id          | UUID   |
| recordId    | UUID   |
| anomalyType | Enum   |
| severity    | Enum   |
| actionTaken | String |

---

# Out of Scope

* Real payment gateway integrations
* Native mobile applications
* Push notifications
* Email notifications
* Live foreign exchange rate APIs
* Enterprise multi-tenancy

---

# Non-Functional Requirements

## Data Integrity

Financial values are stored using **Decimal** types to prevent floating-point precision errors.

## Auditability

Original imported data is never modified or deleted.

## Maintainability

Business logic is separated into dedicated service layers.

## Transparency

Users can trace balances back to the exact expenses and settlements that generated them.

## Reliability

Anomaly detection rules are covered by automated tests.
