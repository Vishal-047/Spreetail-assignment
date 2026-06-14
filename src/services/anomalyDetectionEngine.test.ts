import { describe, it, expect } from 'vitest'
import { detectAnomalies, RawImportRow, Context } from './anomalyDetectionEngine'

describe('Anomaly Detection Engine', () => {
  const context: Context = {
    groupMembers: [
      { id: '1', name: 'Alice', email: 'alice@example.com', joinedAt: new Date('2026-01-01'), leftAt: null },
      { id: '2', name: 'Bob', email: 'bob@example.com', joinedAt: new Date('2026-01-01'), leftAt: null },
      { id: '3', name: 'Meera', email: 'meera@example.com', joinedAt: new Date('2026-01-01'), leftAt: new Date('2026-03-28') }
    ],
    baseCurrency: 'INR',
  }

  it('should detect no anomalies for valid row', () => {
    const row: RawImportRow = {
      date: '2026-06-14',
      description: 'Groceries',
      amount: 50.0,
      currency: 'INR',
      paid_by: 'Alice',
      split_with: 'Alice; Bob',
    }
    const anomalies = detectAnomalies(row, context)
    expect(anomalies).toHaveLength(0)
  })

  it('should detect negative and zero values', () => {
    const row1: RawImportRow = { paid_by: 'Alice', amount: -10.0 }
    expect(detectAnomalies(row1, context)).toContainEqual(expect.objectContaining({ type: 'NEGATIVE_VALUE' }))

    const row2: RawImportRow = { paid_by: 'Alice', amount: 0 }
    expect(detectAnomalies(row2, context)).toContainEqual(expect.objectContaining({ type: 'ZERO_AMOUNT' }))
  })

  it('should detect currency mismatch', () => {
    const row: RawImportRow = { paid_by: 'Alice', amount: 100, currency: 'USD' }
    expect(detectAnomalies(row, context)).toContainEqual(expect.objectContaining({ type: 'CURRENCY_MISMATCH' }))
  })

  it('should detect unknown users', () => {
    const row: RawImportRow = { paid_by: 'Charlie', amount: 40 }
    expect(detectAnomalies(row, context)).toContainEqual(expect.objectContaining({ type: 'UNKNOWN_USER' }))
  })

  it('should detect disguised settlements', () => {
    const row: RawImportRow = { paid_by: 'Alice', amount: 50, description: 'Rohan paid back' }
    expect(detectAnomalies(row, context)).toContainEqual(expect.objectContaining({ type: 'SETTLEMENT_DISGUISED' }))
  })

  it('should detect missing payer', () => {
    const row: RawImportRow = { amount: 50 } // paid_by missing
    expect(detectAnomalies(row, context)).toContainEqual(expect.objectContaining({ type: 'MISSING_PAYER' }))
  })

  it('should detect inactive members', () => {
    const row: RawImportRow = {
      date: '2026-04-05', // After Meera left
      paid_by: 'Alice',
      amount: 50,
      split_with: 'Meera'
    }
    expect(detectAnomalies(row, context)).toContainEqual(expect.objectContaining({ type: 'MEMBER_INACTIVE' }))
  })

  it('should detect ambiguous dates', () => {
    const row: RawImportRow = { paid_by: 'Alice', amount: 50, date: '04-05-2026' }
    expect(detectAnomalies(row, context)).toContainEqual(expect.objectContaining({ type: 'AMBIGUOUS_DATE' }))
  })

  it('should detect split conflicts', () => {
    const row: RawImportRow = { paid_by: 'Alice', amount: 50, split_type: 'equal', split_details: 'Alice 1; Bob 1' }
    expect(detectAnomalies(row, context)).toContainEqual(expect.objectContaining({ type: 'SPLIT_CONFLICT' }))
  })
})
