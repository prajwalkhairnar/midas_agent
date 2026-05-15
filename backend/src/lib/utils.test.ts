import { afterEach, describe, expect, it } from 'vitest'
import { findCharOffset, getConfiguredProviders, parseJsonFromLLM } from './utils.js'

describe('parseJsonFromLLM', () => {
  it('parses raw JSON', () => {
    expect(parseJsonFromLLM<{ ok: boolean }>('{"ok":true}')).toEqual({ ok: true })
  })

  it('parses fenced JSON', () => {
    const input = '```json\n{"value":42}\n```'
    expect(parseJsonFromLLM<{ value: number }>(input)).toEqual({ value: 42 })
  })

  it('parses JSON with trailing commas in arrays', () => {
    const input = `{
      "overallShift": "more_cautious",
      "shiftSummary": "test",
      "languageChanges": [
        { "topic": "demand", "currentLanguage": "cautious", "priorLanguage": "strong", "significance": "high" },
      ],
      "topicsDropped": ["growth",],
      "topicsAdded": []
    }`
    const result = parseJsonFromLLM<{
      overallShift: string
      languageChanges: unknown[]
      topicsDropped: string[]
    }>(input)
    expect(result.overallShift).toBe('more_cautious')
    expect(result.languageChanges).toHaveLength(1)
    expect(result.topicsDropped).toEqual(['growth'])
  })
})

describe('getConfiguredProviders', () => {
  const env = process.env

  afterEach(() => {
    process.env = env
  })

  it('returns groq when only GROQ_API_KEY is set', () => {
    process.env.USE_MOCK_LLM = 'false'
    process.env.GROQ_API_KEY = 'gsk_test'
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.NVIDIA_API_KEY
    expect(getConfiguredProviders()).toEqual(['groq'])
  })

  it('returns all providers in mock mode', () => {
    process.env = { ...env, USE_MOCK_LLM: 'true' }
    expect(getConfiguredProviders()).toEqual(['groq', 'anthropic', 'nvidia'])
  })
})

describe('findCharOffset', () => {
  it('finds case-insensitive match', () => {
    const haystack = 'Revenue grew strongly in the quarter'
    expect(findCharOffset(haystack, 'revenue grew')).toBe(0)
  })

  it('returns fallback when not found', () => {
    expect(findCharOffset('hello', 'missing', 99)).toBe(99)
  })
})
