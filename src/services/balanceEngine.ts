import { Decimal } from 'decimal.js'

export type MinimalExpense = {
  id: string
  amount: Decimal
  payers: { userId: string; amountPaid: Decimal }[]
  participants: { userId: string; amountOwed: Decimal }[]
}

export type MinimalSettlement = {
  id: string
  payerId: string
  payeeId: string
  amount: Decimal
}

export type BalanceAdjustment = {
  userId: string
  amount: Decimal
  reason: string
}

export type UserBalance = {
  userId: string
  netBalance: Decimal
  adjustments: BalanceAdjustment[]
}

export type SettlementPlan = {
  payerId: string
  payeeId: string
  amount: Decimal
}

/**
 * Calculates net balances for all users in a group based on expenses and settlements.
 */
export function calculateBalances(
  expenses: MinimalExpense[],
  settlements: MinimalSettlement[],
  memberIds: string[]
): UserBalance[] {
  const balances: Record<string, UserBalance> = {}

  // Initialize balances for all known members
  for (const id of memberIds) {
    balances[id] = {
      userId: id,
      netBalance: new Decimal(0),
      adjustments: [],
    }
  }

  // Process Expenses
  for (const expense of expenses) {
    // Credit payers
    for (const payer of expense.payers) {
      if (!balances[payer.userId]) continue
      balances[payer.userId].netBalance = balances[payer.userId].netBalance.plus(payer.amountPaid)
      balances[payer.userId].adjustments.push({
        userId: payer.userId,
        amount: payer.amountPaid,
        reason: `Paid for expense ${expense.id}`,
      })
    }
    // Debit participants
    for (const participant of expense.participants) {
      if (!balances[participant.userId]) continue
      balances[participant.userId].netBalance = balances[participant.userId].netBalance.minus(participant.amountOwed)
      balances[participant.userId].adjustments.push({
        userId: participant.userId,
        amount: participant.amountOwed.negated(),
        reason: `Owes for expense ${expense.id}`,
      })
    }
  }

  // Process Settlements
  for (const settlement of settlements) {
    if (balances[settlement.payerId]) {
      balances[settlement.payerId].netBalance = balances[settlement.payerId].netBalance.plus(settlement.amount)
      balances[settlement.payerId].adjustments.push({
        userId: settlement.payerId,
        amount: settlement.amount,
        reason: `Paid settlement ${settlement.id}`,
      })
    }
    if (balances[settlement.payeeId]) {
      balances[settlement.payeeId].netBalance = balances[settlement.payeeId].netBalance.minus(settlement.amount)
      balances[settlement.payeeId].adjustments.push({
        userId: settlement.payeeId,
        amount: settlement.amount.negated(),
        reason: `Received settlement ${settlement.id}`,
      })
    }
  }

  return Object.values(balances)
}

/**
 * Calculates the minimal number of transactions required to settle all debts.
 * Greedy algorithm: match largest debtor with largest creditor.
 */
export function calculateSettlementPlan(balances: UserBalance[]): SettlementPlan[] {
  const plan: SettlementPlan[] = []

  const debtors = balances.filter((b) => b.netBalance.isNegative()).sort((a, b) => a.netBalance.comparedTo(b.netBalance)) // Most negative first
  const creditors = balances.filter((b) => b.netBalance.isPositive()).sort((a, b) => b.netBalance.comparedTo(a.netBalance)) // Most positive first

  let d = 0
  let c = 0

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d]
    const creditor = creditors[c]

    const amountToSettle = Decimal.min(debtor.netBalance.abs(), creditor.netBalance)

    if (amountToSettle.greaterThan(0)) {
      plan.push({
        payerId: debtor.userId,
        payeeId: creditor.userId,
        amount: amountToSettle,
      })
    }

    debtor.netBalance = debtor.netBalance.plus(amountToSettle)
    creditor.netBalance = creditor.netBalance.minus(amountToSettle)

    // Move to next if balance is resolved (using a small epsilon for floating point logic, though Decimal is exact, checking for 0 is safe)
    if (debtor.netBalance.isZero()) d++
    if (creditor.netBalance.isZero()) c++
  }

  return plan
}
