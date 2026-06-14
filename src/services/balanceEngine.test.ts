import { describe, it, expect } from 'vitest'
import { calculateBalances, calculateSettlementPlan, MinimalExpense, MinimalSettlement } from './balanceEngine'
import { Decimal } from 'decimal.js'

describe('Balance Engine', () => {
  it('should calculate net balances correctly for equal splits', () => {
    const expenses: MinimalExpense[] = [
      {
        id: 'e1',
        amount: new Decimal(90),
        payers: [{ userId: 'user1', amountPaid: new Decimal(90) }],
        participants: [
          { userId: 'user1', amountOwed: new Decimal(30) },
          { userId: 'user2', amountOwed: new Decimal(30) },
          { userId: 'user3', amountOwed: new Decimal(30) },
        ],
      },
    ]

    const balances = calculateBalances(expenses, [], ['user1', 'user2', 'user3'])
    
    expect(balances.find((b) => b.userId === 'user1')?.netBalance.toNumber()).toBe(60)
    expect(balances.find((b) => b.userId === 'user2')?.netBalance.toNumber()).toBe(-30)
    expect(balances.find((b) => b.userId === 'user3')?.netBalance.toNumber()).toBe(-30)
  })

  it('should generate a simplified settlement plan', () => {
    // A owes B $50. B owes C $50.
    // Optimal plan: A pays C $50.
    const balances = [
      { userId: 'A', netBalance: new Decimal(-50), adjustments: [] },
      { userId: 'B', netBalance: new Decimal(0), adjustments: [] },
      { userId: 'C', netBalance: new Decimal(50), adjustments: [] },
    ]

    const plan = calculateSettlementPlan(balances)
    
    expect(plan).toHaveLength(1)
    expect(plan[0].payerId).toBe('A')
    expect(plan[0].payeeId).toBe('C')
    expect(plan[0].amount.toNumber()).toBe(50)
  })
})
