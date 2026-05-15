import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadDataset(name: string): unknown[] {
  const file = path.join(__dirname, 'datasets', name)
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as unknown[]
}

async function main() {
  const guidance = loadDataset('guidance-extraction.json')
  const tone = loadDataset('tone-shifts.json')
  const redFlags = loadDataset('red-flags.json')

  const summary = {
    timestamp: new Date().toISOString(),
    suites: {
      guidance: { cases: guidance.length, status: guidance.length ? 'ready' : 'needs_labels' },
      tone: { cases: tone.length, status: tone.length ? 'ready' : 'needs_labels' },
      redFlags: { cases: redFlags.length, status: redFlags.length ? 'ready' : 'needs_labels' },
    },
  }

  const outDir = path.join(__dirname, 'results')
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `eval-${Date.now()}.json`)
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2))

  console.log('Eval summary')
  console.table(summary.suites)
  console.log(`Written to ${outFile}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
