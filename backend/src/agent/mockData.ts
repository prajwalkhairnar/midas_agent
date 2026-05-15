import type { TranscriptData } from '../types/index.js'

export function getMockTranscripts(ticker: string): {
  current: TranscriptData
  prior: TranscriptData
} {
  const upper = ticker.toUpperCase()
  const current: TranscriptData = {
    quarter: 'Q4 2024',
    date: '2024-10-31',
    preparedRemarks: `${upper} delivered record revenue in Q4 2024. We expect revenue growth in the mid-teens range for the full year. Services grew 14% year over year. We remain thoughtful about the macro environment while investing in AI capabilities across the portfolio.`,
    questionsAndAnswers: `Analyst: Can you clarify demand trends in enterprise? CEO: We see solid pipeline conversion, though customers remain selective on large deals. CFO: We are maintaining disciplined expense growth while expanding margins.`,
  }
  const prior: TranscriptData = {
    quarter: 'Q3 2024',
    date: '2024-07-31',
    preparedRemarks: `${upper} posted strong Q3 results with broad-based demand. We see strong demand across our portfolio and expect continued momentum into the holiday quarter. Services grew 12% year over year.`,
    questionsAndAnswers: `Analyst: Any change to full-year outlook? CEO: We are raising our outlook modestly based on unit growth acceleration.`,
  }
  return { current, prior }
}
