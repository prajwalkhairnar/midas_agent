import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function loadPrompt(name: string): string {
  const promptPath = path.join(__dirname, '..', 'prompts', `${name}.md`)
  return fs.readFileSync(promptPath, 'utf-8')
}

function stripTrailingCommas(json: string): string {
  return json.replace(/,\s*([}\]])/g, '$1')
}

function extractBalanced(
  text: string,
  start: number,
  open: string,
  close: string,
): string | null {
  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === open) depth++
    if (ch === close) {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function extractJsonCandidates(text: string): string[] {
  const trimmed = text.trim()
  const candidates: string[] = []

  for (const match of trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) {
    candidates.push(match[1].trim())
  }

  candidates.push(trimmed)

  const objectStart = trimmed.indexOf('{')
  if (objectStart >= 0) {
    const object = extractBalanced(trimmed, objectStart, '{', '}')
    if (object) candidates.push(object)
  }

  const arrayStart = trimmed.indexOf('[')
  if (arrayStart >= 0) {
    const array = extractBalanced(trimmed, arrayStart, '[', ']')
    if (array) candidates.push(array)
  }

  return [...new Set(candidates.filter(Boolean))]
}

export function parseJsonFromLLM<T>(text: string): T {
  const candidates = extractJsonCandidates(text)
  let lastError: Error | undefined

  for (const raw of candidates) {
    for (const candidate of [raw, stripTrailingCommas(raw)]) {
      try {
        return JSON.parse(candidate) as T
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
      }
    }
  }

  throw lastError ?? new Error('Failed to parse JSON from LLM response')
}

export function findCharOffset(haystack: string, needle: string, fallback = 0): number {
  if (!needle) return fallback
  const idx = haystack.toLowerCase().indexOf(needle.toLowerCase())
  return idx >= 0 ? idx : fallback
}

export const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-5',
  groq: 'llama-3.3-70b-versatile',
  nvidia: 'meta/llama-3.3-70b-instruct',
}

function hasApiKey(name: string): boolean {
  const value = process.env[name]?.trim()
  return Boolean(value && value.length > 0)
}

export function getConfiguredProviders(): string[] {
  if (process.env.USE_MOCK_LLM === 'true') {
    return ['groq', 'anthropic', 'nvidia']
  }

  const providers: string[] = []
  if (hasApiKey('ANTHROPIC_API_KEY')) providers.push('anthropic')
  if (hasApiKey('GROQ_API_KEY')) providers.push('groq')
  if (hasApiKey('NVIDIA_API_KEY')) providers.push('nvidia')
  return providers
}
