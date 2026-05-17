import { describe, expect, it } from 'vitest'
import { normalizeRedFlags } from './redflag.js'

describe('normalizeRedFlags', () => {
  it('accepts a bare array', () => {
    const flags = normalizeRedFlags([
      {
        text: 'Test flag',
        type: 'deflection',
        severity: 'high',
        evidence: 'quote',
        charOffset: 10,
      },
    ])
    expect(flags).toHaveLength(1)
    expect(flags[0].text).toBe('Test flag')
  })

  it('unwraps { redFlags: [...] } from json_object responses', () => {
    const flags = normalizeRedFlags({
      redFlags: [
        {
          text: 'Buried guidance cut',
          type: 'guidance_cut',
          severity: 'medium',
          evidence: 'mid-teens',
          charOffset: 0,
        },
      ],
    })
    expect(flags).toHaveLength(1)
    expect(flags[0].type).toBe('guidance_cut')
  })

  it('returns empty array for empty object', () => {
    expect(normalizeRedFlags({ redFlags: [] })).toEqual([])
    expect(normalizeRedFlags({})).toEqual([])
  })

  it('skips invalid entries without text', () => {
    const flags = normalizeRedFlags({
      redFlags: [{ severity: 'high' }, { text: 'valid', type: 'x', severity: 'low', evidence: '', charOffset: 0 }],
    })
    expect(flags).toHaveLength(1)
    expect(flags[0].text).toBe('valid')
    expect(flags[0].type).toBe('hedged_language')
  })
})
