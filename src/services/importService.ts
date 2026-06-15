import prismaPkg from '@prisma/client'
import type { AnomalyType } from '../types/anomaly'
import { parse } from 'csv-parse/sync'
import { detectAnomalies, RawImportRow, Context, normalizeName } from './anomalyDetectionEngine'

const PrismaClient = (prismaPkg as any).PrismaClient

const prisma = new PrismaClient()

export class ImportService {
  /**
   * Processes a raw CSV string, stores immutable records, and detects anomalies.
   */
  async processCsvImport(
    csvContent: string,
    groupId: string,
    importedById: string,
    baseCurrency: string = 'INR'
  ) {
    // 1. Create the session
    const session = await prisma.importSession.create({
      data: {
        groupId,
        importedById,
        status: 'PROCESSING',
      },
    })

    // 2. Parse CSV
    let rawRows: RawImportRow[]
    try {
      rawRows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (error: any) {
      await prisma.importSession.update({
        where: { id: session.id },
        data: { status: 'FAILED' },
      })
      throw new Error(`CSV Parsing failed: ${error.message}`)
    }

    // 3. Fetch Context for Anomaly Engine
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
    })
    
    const context: Context = {
      baseCurrency,
      groupMembers: members.map((m) => ({
        id: m.userId,
        name: m.user.name,
        email: m.user.email,
        joinedAt: m.joinedAt,
        leftAt: m.leftAt,
      })),
    }

    // Track rows to find duplicates within the session
    const seenRecords: {
      rowId: string
      date: string
      description: string
      amount: number
      paid_by: string
    }[] = []

    let hasAnomalies = false

    // 4. Process each row
    for (const row of rawRows) {
      // Save immutable record
      const record = await prisma.importRecord.create({
        data: {
          importSessionId: session.id,
          rawData: row as unknown as Record<string, any>,
          status: 'PENDING',
        },
      })

      // Run pure function anomaly detection
      const baseAnomalies = detectAnomalies(row, context)
      
      const anomaliesToCreate: { type: AnomalyType; description: string }[] = [...baseAnomalies]

      // Stateful Anomaly Detection: Duplicates & Conflicts
      const rowDate = row.date || ''
      const rowDesc = normalizeName(row.description || '')
      const rowAmountStr = String(row.amount || '').replace(/,/g, '')
      const rowAmount = parseFloat(rowAmountStr)
      const rowPayer = normalizeName(row.paid_by || '')

      if (!isNaN(rowAmount)) {
        // Check session duplicates
        const matchingDateDesc = seenRecords.filter(
          (r) => r.date === rowDate && normalizeName(r.description) === rowDesc
        )

        for (const match of matchingDateDesc) {
          if (match.paid_by === rowPayer && match.amount === rowAmount) {
            anomaliesToCreate.push({
              type: 'NEAR_DUPLICATE',
              description: `This row appears to be a near duplicate of another row in this import.`,
            })
          } else {
            anomaliesToCreate.push({
              type: 'CONFLICTING_DUPLICATE',
              description: `Conflicting duplicate detected. Another row claims a different amount/payer for this same event.`,
            })
          }
        }
        
        // Push to seen
        seenRecords.push({
          rowId: record.id,
          date: rowDate,
          description: row.description || '',
          amount: rowAmount,
          paid_by: row.paid_by || '',
        })
      }

      // 5. Store anomalies
      if (anomaliesToCreate.length > 0) {
        hasAnomalies = true
        await prisma.importAnomaly.createMany({
          data: anomaliesToCreate.map((a) => ({
            importRecordId: record.id,
            type: a.type,
            description: a.description,
            status: 'PENDING_REVIEW',
          })),
        })
      } else {
        // If no anomalies, mark ready
        await prisma.importRecord.update({
          where: { id: record.id },
          data: { status: 'READY_TO_IMPORT' },
        })
      }
    }

    // 6. Update Session Status
    await prisma.importSession.update({
      where: { id: session.id },
      data: {
        status: hasAnomalies ? 'PENDING_REVIEW' : 'PROCESSING', // PROCESSING implies ready to finalize if no anomalies
      },
    })

    return session.id
  }
}
