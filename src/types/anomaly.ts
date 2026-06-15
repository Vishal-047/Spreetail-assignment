// Shared type for Anomaly enums to avoid depending on runtime Prisma client types
export type AnomalyType =
  | 'DUPLICATE_EXPENSE'
  | 'NEAR_DUPLICATE'
  | 'CONFLICTING_DUPLICATE'
  | 'CURRENCY_MISMATCH'
  | 'INVALID_DATE'
  | 'AMBIGUOUS_DATE'
  | 'NEGATIVE_VALUE'
  | 'ZERO_AMOUNT'
  | 'MISSING_PARTICIPANTS'
  | 'MISSING_PAYER'
  | 'SETTLEMENT_DISGUISED'
  | 'MEMBER_INACTIVE'
  | 'UNKNOWN_USER'
  | 'SPLIT_CONFLICT'
  | 'INVALID_SPLIT'

export type AnomalyStatus = 'PENDING_REVIEW' | 'RESOLVED'
