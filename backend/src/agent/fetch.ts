import type { TranscriptData } from '../types/index.js'
import { getMockTranscripts } from './mockData.js'

export interface TranscriptPair {
  current: TranscriptData
  prior: TranscriptData
}

function useMockFetch(): boolean {
  const key = process.env.EARNINGSCALL_API_KEY
  return (
    process.env.USE_MOCK_FETCH === 'true' ||
    process.env.NODE_ENV === 'test' ||
    !key ||
    key === 'demo'
  )
}

export async function fetchTranscripts(ticker: string): Promise<TranscriptPair> {
  if (useMockFetch()) {
    return getMockTranscripts(ticker)
  }

  try {
    const { getCompany } = await import('earningscall')
    const company = await getCompany({ symbol: ticker.toUpperCase() })

    const currentRaw = await company.getTranscript({ year: 2024, quarter: 4 })
    const priorRaw = await company.getTranscript({ year: 2024, quarter: 3 })

    if (!currentRaw || !priorRaw) {
      return getMockTranscripts(ticker)
    }

    return {
      current: mapEarningsCallTranscript(currentRaw, 'Q4 2024'),
      prior: mapEarningsCallTranscript(priorRaw, 'Q3 2024'),
    }
  } catch {
    return getMockTranscripts(ticker)
  }
}

function mapEarningsCallTranscript(
  data: { preparedRemarks?: string; questionsAndAnswers?: string; text?: string; event?: { year?: number; quarter?: number } },
  quarter: string,
): TranscriptData {
  const prepared = data.preparedRemarks ?? data.text ?? ''
  const qa = data.questionsAndAnswers ?? ''
  return {
    quarter,
    date: new Date().toISOString().slice(0, 10),
    preparedRemarks: prepared,
    questionsAndAnswers: qa,
  }
}
