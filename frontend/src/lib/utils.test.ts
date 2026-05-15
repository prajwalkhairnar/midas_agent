import { describe, expect, it } from 'vitest'
import { cn, findCharOffset } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toContain('px-2')
  })
})

describe('findCharOffset', () => {
  it('finds substring', () => {
    expect(findCharOffset('hello world', 'world')).toBe(6)
  })
})
