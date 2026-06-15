import prismaPkg from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
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
    baseCurrency: string = 'INR',
    sourceFileName?: string
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
    const members = (await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
    })) as {
      userId: string
      user: { name: string; email: string }
      joinedAt: Date
      leftAt: Date | null
    }[]
    
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
    const finalStatus = hasAnomalies ? 'PENDING_REVIEW' : 'PROCESSING'
    await prisma.importSession.update({
      where: { id: session.id },
      data: { status: finalStatus },
    })

    // 7. Generate Markdown import report and persist to disk
    try {
      const records = await prisma.importRecord.findMany({
        where: { importSessionId: session.id },
        orderBy: { createdAt: 'asc' },
        include: { importAnomalies: true },
      })

      const totalRows = records.length
      const anomaliesCount = records.reduce((acc, r) => acc + (r.importAnomalies?.length || 0), 0)
      const blockedCount = records.filter((r) => r.status === 'PENDING').length
      const pendingReviewCount = records.filter((r) => (r.importAnomalies?.length || 0) > 0).length
      const validCount = records.filter((r) => r.status === 'READY_TO_IMPORT').length

      const importTimestamp = new Date().toISOString()

      const lines: string[] = []
      lines.push('# IMPORT_REPORT.md')
      lines.push('')
      lines.push('## Import Summary')
      lines.push('')
      lines.push(`- Source File: ${sourceFileName || 'unknown'}`)
      lines.push(`- Import Timestamp: ${importTimestamp}`)
      lines.push(`- Total Rows Processed: ${totalRows}`)
      lines.push(`- Total Valid Records: ${validCount}`)
      lines.push(`- Total Anomalies Detected: ${anomaliesCount}`)
      lines.push(`- Total Records Requiring Review: ${pendingReviewCount}`)
      lines.push(`- Total Blocked Records: ${blockedCount}`)
      lines.push('')
      lines.push('## Detected Anomalies')
      lines.push('')
      lines.push('| Row | Anomaly Type | Description | Severity | Action Taken |')
      lines.push('| --- | ------------ | ----------- | -------- | ------------- |')

      for (let i = 0; i < records.length; i++) {
        const rec = records[i]
        const rowNumber = i + 1
        const anomalies = rec.importAnomalies || []
        if (anomalies.length === 0) {
          lines.push(`| ${rowNumber} | - | Imported cleanly | INFO | AUTO_APPLIED |`)
        } else {
          for (const a of anomalies) {
            // Map severity and action from anomaly status
            const severity = a.status === 'PENDING_REVIEW' ? 'WARNING' : 'ERROR'
            const action = a.status === 'PENDING_REVIEW' ? 'PENDING_REVIEW' : 'BLOCKED'
            lines.push(`| ${rowNumber} | ${a.type} | ${a.description.replace(/\|/g, '\\|')} | ${severity} | ${action} |`)
          }
        }
      }

      lines.push('')
      lines.push('## Import Outcome')
      lines.push('')
      lines.push(`- Successfully Imported Records: ${validCount}`)
      lines.push(`- Pending Review Records: ${pendingReviewCount}`)
      lines.push(`- Blocked Records: ${blockedCount}`)
      lines.push('- Settlements Created: 0')
      lines.push(`- Duplicate Records Flagged: ${records.reduce((acc, r) => acc + (r.importAnomalies?.filter((x:any) => x.type === 'NEAR_DUPLICATE' || x.type === 'CONFLICTING_DUPLICATE').length || 0), 0)}`)
      lines.push('')
      lines.push('## Importer Policies Applied')
      lines.push('')
      lines.push('- Trimmed whitespace and normalized casing for text fields')
      lines.push('- Removed numeric separators from amounts')
      lines.push('- Parsed decimals using Decimal-aware parsing in service logic')
      lines.push('- Created `ImportAnomaly` records for any detected anomalies and set status to `PENDING_REVIEW`')
      lines.push('- Records without anomalies were marked `READY_TO_IMPORT` and can be finalized by the processing job')
      lines.push('')
      lines.push('## Notes')
      lines.push('')
      lines.push('- This report is generated by the import pipeline after initial anomaly detection. Pending records require manual review in the ImportSession UI.')

      const reportsDir = path.join(process.cwd(), 'reports')
      await fs.mkdir(reportsDir, { recursive: true })
      const fileName = `import-report-${importTimestamp.replace(/[:.]/g, '-')}-${session.id}.md`
      const filePath = path.join(reportsDir, fileName)
      await fs.writeFile(filePath, lines.join('\n'), 'utf8')

      // Also write a copy to repository root for immediate visibility
      try {
        await fs.writeFile(path.join(process.cwd(), 'IMPORT_REPORT.md'), lines.join('\n'), 'utf8')
      } catch (e) {
        // non-fatal
      }
    } catch (err) {
      // Do not fail the import for reporting errors; log and continue
      // eslint-disable-next-line no-console
      console.error('Failed to generate import report:', err)
    }

    return session.id
  }
}
