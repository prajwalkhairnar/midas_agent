import { callLLM } from '../lib/llm.js'
import { loadPrompt, parseJsonFromLLM } from '../lib/utils.js'
import type { LLMConfig, RedFlag, ToneResult, TranscriptData } from '../types/index.js'

const RED_FLAG_TYPES = new Set<RedFlag['type']>([
  'deflection',
  'guidance_cut',
  'missing_topic',
  'hedged_language',
  'analyst_pushback',
])

const SEVERITIES = new Set<RedFlag['severity']>(['high', 'medium', 'low'])

/** Groq json_object mode returns `{ redFlags: [...] }`, not a bare array. */
export function normalizeRedFlags(parsed: unknown): RedFlag[] {
  const rawList = extractRedFlagList(parsed)
  return rawList.map(coerceRedFlag).filter((f): f is RedFlag => f !== null)
}

function extractRedFlagList(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed
  if (!parsed || typeof parsed !== 'object') return []

  const obj = parsed as Record<string, unknown>
  for (const key of ['redFlags', 'red_flags', 'flags', 'items', 'results']) {
    const value = obj[key]
    if (Array.isArray(value)) return value
  }
  return []
}

function coerceRedFlag(item: unknown): RedFlag | null {
  if (!item || typeof item !== 'object') return null
  const o = item as Record<string, unknown>
  const text = typeof o.text === 'string' ? o.text.trim() : ''
  if (!text) return null

  const typeRaw = typeof o.type === 'string' ? o.type : 'hedged_language'
  const severityRaw = typeof o.severity === 'string' ? o.severity : 'medium'

  return {
    text,
    type: RED_FLAG_TYPES.has(typeRaw as RedFlag['type'])
      ? (typeRaw as RedFlag['type'])
      : 'hedged_language',
    severity: SEVERITIES.has(severityRaw as RedFlag['severity'])
      ? (severityRaw as RedFlag['severity'])
      : 'medium',
    evidence: typeof o.evidence === 'string' ? o.evidence : '',
    charOffset: typeof o.charOffset === 'number' && Number.isFinite(o.charOffset) ? o.charOffset : 0,
  }
}

export async function detectRedFlags(
  current: TranscriptData,
  prior: TranscriptData,
  tone: ToneResult,
  llmConfig: LLMConfig,
): Promise<RedFlag[]> {
  const systemPrompt = loadPrompt('redflag')
  const userMessage = `Current transcript (${current.quarter}):
${current.preparedRemarks}
${current.questionsAndAnswers}

Prior transcript (${prior.quarter}):
${prior.preparedRemarks}

Tone analysis:
${JSON.stringify(tone, null, 2)}`

  const raw = await callLLM({
    ...llmConfig,
    systemPrompt,
    userMessage,
    maxTokens: 2000,
    jsonMode: true,
  })

  try {
    const parsed = parseJsonFromLLM<unknown>(raw)
    return normalizeRedFlags(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Red flag detection returned invalid JSON: ${message}`)
  }
}
