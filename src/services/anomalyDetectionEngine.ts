import { AnomalyType } from '@prisma/client'

export type RawImportRow = {
  date?: string
  description?: string
  paid_by?: string
  amount?: string | number
  currency?: string
  split_type?: string
  split_with?: string
  split_details?: string
  notes?: string
}

export type Anomaly = {
  type: AnomalyType
  description: string
}

export type Context = {
  groupMembers: { id: string; name: string; email: string; joinedAt: Date; leftAt: Date | null }[]
  baseCurrency: string
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Validates a single parsed row from CSV to detect data anomalies based on strict policies.
 */
export function detectAnomalies(row: RawImportRow, context: Context): Anomaly[] {
  const anomalies: Anomaly[] = []

  const payerName = row.paid_by?.trim()
  if (!payerName) {
    anomalies.push({ type: 'MISSING_PAYER', description: 'Payer is missing from the record.' })
  }

  // Zero and Negative amounts
  const rawAmount = row.amount !== undefined && row.amount !== null ? row.amount : ''
  const amountStr = String(rawAmount).replace(/,/g, '') // auto-strip commas
  const amount = parseFloat(amountStr)

  if (isNaN(amount)) {
    anomalies.push({ type: 'NEGATIVE_VALUE', description: 'Amount is not a valid number.' })
  } else if (amount === 0) {
    anomalies.push({ type: 'ZERO_AMOUNT', description: 'Amount is exactly zero.' })
  } else if (amount < 0) {
    anomalies.push({ type: 'NEGATIVE_VALUE', description: `Amount ${amount} is negative. Potentially a refund.` })
  }

  // Currency Check
  const currency = row.currency?.trim().toUpperCase() || context.baseCurrency
  if (currency !== context.baseCurrency) {
    anomalies.push({ type: 'CURRENCY_MISMATCH', description: `Expense is in ${currency}, group is in ${context.baseCurrency}.` })
  }

  // Date Check & Ambiguity
  const rawDate = row.date?.trim() || ''
  const isAmbiguous = /^\d{2}-\d{2}-\d{4}$/.test(rawDate) && parseInt(rawDate.split('-')[0]) <= 12 && parseInt(rawDate.split('-')[1]) <= 12
  if (isAmbiguous) {
    anomalies.push({ type: 'AMBIGUOUS_DATE', description: `Date ${rawDate} is ambiguous (DD-MM vs MM-DD).` })
  }
  
  let expenseDate = new Date()
  // simple parse attempt for temporal logic if not ambiguous
  if (!isAmbiguous) {
    const d = new Date(rawDate)
    if (!isNaN(d.getTime())) {
      expenseDate = d
    }
  }

  // Participants & Memberships Check
  const participantNames = row.split_with ? row.split_with.split(';').map(n => n.trim()) : []
  const allInvolvedNames = [...participantNames]
  if (payerName && !allInvolvedNames.includes(payerName)) {
    allInvolvedNames.push(payerName)
  }

  for (const name of allInvolvedNames) {
    if (!name) continue
    const member = context.groupMembers.find(m => 
      normalizeName(m.name) === normalizeName(name) || normalizeName(m.email) === normalizeName(name)
    )

    if (!member) {
      anomalies.push({ type: 'UNKNOWN_USER', description: `User '${name}' is not recognized in the group.` })
    } else {
      // Check temporal constraints
      if (expenseDate < member.joinedAt || (member.leftAt && expenseDate > member.leftAt)) {
        anomalies.push({ type: 'MEMBER_INACTIVE', description: `User '${name}' was inactive on the expense date.` })
      }
    }
  }

  // Disguised Settlement
  const desc = row.description?.trim().toLowerCase() || ''
  if (desc.includes('deposit') || desc.includes('paid back') || desc.includes('settlement')) {
    anomalies.push({ type: 'SETTLEMENT_DISGUISED', description: 'Description indicates this might be a settlement.' })
  }

  // Split Logic Validation
  const splitType = row.split_type?.trim().toLowerCase()
  if (splitType === 'percentage' && row.split_details) {
    // Extract percentages and sum them
    const details = row.split_details.split(';')
    let totalPct = 0
    for (const d of details) {
      const match = d.match(/[\d.]+/)
      if (match) totalPct += parseFloat(match[0])
    }
    // allow tiny floating point drift just in case, though the CSV has 110
    if (Math.abs(totalPct - 100) > 0.01) {
      anomalies.push({ type: 'INVALID_SPLIT', description: `Percentages sum to ${totalPct}%, not 100%.` })
    }
  } else if (splitType === 'equal' && row.split_details) {
    // Check if there are explicit shares provided in split_details while type is equal
    if (row.split_details.match(/\d/)) {
      anomalies.push({ type: 'SPLIT_CONFLICT', description: 'Split type is equal but custom shares/details are provided.' })
    }
  }

  return anomalies
}
