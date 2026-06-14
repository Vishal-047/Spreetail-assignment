# AI Usage

## AI Tools Used
- Google Gemini 3.1 Pro (via Antigravity AI assistant)

## Key Prompts Used
1. *"Here's my database schema (PostgreSQL)... Task: Review this schema for: Normalization issues, Constraints, Indexes, Foreign keys, Audit trails."*
2. *"Add this file accordingly so that I can avoid bulk commit: README.md, SCOPE.md, DECISIONS.md, Import report, AI_USAGE.md"*

## Examples of Incorrect AI Output & Corrections

1. **Issue:** The AI initially assumed the `group_memberships` unique constraint `UNIQUE(group_id, user_id)` was perfectly fine.
   *   **How I caught it:** I realized that if a flatmate moves out and then moves back in a year later, this strict constraint would crash the system or prevent them from rejoining.
   *   **What I changed:** I modified the constraint to `UNIQUE(group_id, user_id, joined_date)` to allow a user to have multiple distinct membership periods in the same group.

2. **Issue:** When discussing audit trails, the AI suggested adding `deleted_at` to the `expenses` table for soft deletes, but forgot to recommend an accompanying `deleted_by` column.
   *   **How I caught it:** While reviewing the proposed audit fields (`created_by`, `updated_by`), I noticed the gap in accountability for deletions.
   *   **What I changed:** I ensured that my final schema included both a `deleted_at TIMESTAMP` and a `deleted_by INT REFERENCES users(id)` to maintain a strict financial audit trail.

3. **Issue:** The AI generated a mock import report but used a date format (`MM-DD`) that was incompatible with standard PostgreSQL `DATE` types.
   *   **How I caught it:** I reviewed the mock anomaly descriptions against my database validation scripts.
   *   **What I changed:** I updated the data validation logic to standardize all incoming dates to `YYYY-MM-DD` before attempting to insert them into the database, and reflected this in the documentation.
