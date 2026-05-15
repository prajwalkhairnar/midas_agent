import { describe, expect, it } from 'vitest'
import { scoreExtraction } from './judge.js'

describe('scoreExtraction', () => {
  it('scores exact match', () => {
    expect(scoreExtraction('revenue beat', 'revenue beat')).toBe('match')
  })

  it('scores partial match', () => {
    expect(scoreExtraction('revenue beat consensus', 'revenue beat')).toBe('partial')
  })

  it('scores miss', () => {
    expect(scoreExtraction('margin expansion', 'revenue beat')).toBe('miss')
  })
})
