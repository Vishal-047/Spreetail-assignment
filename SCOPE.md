# Scope & Data Anomaly Log

## Database Schema
The core database schema handles users, groups, dynamic group memberships (with join/leave dates), expenses, and expense splits. It also includes comprehensive tables for tracking CSV import operations and their associated anomalies.

### Key Tables:
- `users`: Core user accounts.
- `groups`: Logical groupings (e.g., specific flat, trip).
- `group_memberships`: Tracks who is in what group and when (crucial for pro-rata splits).
- `expenses`: The central record of a shared cost.
- `expense_splits`: How each expense is divided among users, including how much each person paid and owes.
- `import_logs`: Audit trail for bulk data ingestion.
- `import_anomalies`: Detailed record of any data issues found during import.

## Data Anomaly Log

During the CSV ingestion process, the following data problems are systematically identified and handled:

| Anomaly Type | Description | Handling Strategy |
| :--- | :--- | :--- |
| **Missing Currency** | Row lacks a specified currency code. | Fallback to default group currency (e.g., INR) and flag for user review. |
| **Negative Amount** | The expense amount is negative. | If `is_refund` is false, flag as an error; otherwise, process as a refund. |
| **Unknown User** | An email or username in the CSV doesn't exist. | Auto-create a stub user or flag for manual mapping depending on settings. |
| **Duplicate Row** | An exact match of date, amount, and description. | Flag as a potential duplicate and ignore until explicitly approved. |
| **Invalid Split Math** | The sum of splits does not equal the total amount. | Flag as error; require manual correction before finalizing import. |
