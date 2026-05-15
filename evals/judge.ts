export type MatchScore = 'match' | 'partial' | 'miss'

export function scoreExtraction(
  predicted: string,
  expected: string,
): MatchScore {
  const p = predicted.toLowerCase().trim()
  const e = expected.toLowerCase().trim()
  if (p === e) return 'match'
  if (p.includes(e) || e.includes(p)) return 'partial'
  return 'miss'
}
