# Import Report

**Import ID:** `IMP-1042`
**Date:** 2024-04-20
**Filename:** `goa_trip_expenses.csv`
**Total Rows:** 150
**Successfully Imported:** 142
**Anomalies Flagged:** 8

## Detected Anomalies

1. **Row 14:** `Anomaly Type: Missing Currency`
   *   *Description:* Amount is 500, but currency column is blank.
   *   *Action Taken:* Auto-fixed to INR (group default) and flagged for review.
2. **Row 42:** `Anomaly Type: Duplicate Row`
   *   *Description:* Identical to Row 41 (Date: 04-12, Amount: 1500, Desc: Dinner at shacks).
   *   *Action Taken:* Ignored second row; flagged for manual user decision.
3. **Row 89:** `Anomaly Type: Invalid Split Math`
   *   *Description:* Total expense is 3000, but splits only sum to 2500.
   *   *Action Taken:* Flagged as error; expense not imported.
4. **Row 105:** `Anomaly Type: Unknown User`
   *   *Description:* Email 'sam.newguy@email.com' not found in system.
   *   *Action Taken:* Flagged; waiting for user mapping.
