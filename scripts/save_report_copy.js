const fs = require('fs')
const path = require('path')

async function main() {
  const repoRoot = process.cwd()
  const src = path.join(repoRoot, 'IMPORT_REPORT.md')
  if (!fs.existsSync(src)) {
    console.error('IMPORT_REPORT.md not found in repo root.')
    process.exit(1)
  }
  const content = fs.readFileSync(src, 'utf8')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const sessionId = Math.random().toString(36).slice(2, 10)
  const reportsDir = path.join(repoRoot, 'reports')
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir)
  const fileName = `import-report-${timestamp}-${sessionId}.md`
  const dest = path.join(reportsDir, fileName)
  fs.writeFileSync(dest, content, 'utf8')
  console.log('Saved report to', dest)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
