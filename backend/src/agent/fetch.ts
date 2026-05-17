import * as cheerio from 'cheerio'
import { createLogger } from '../lib/logger.js'
import type { TranscriptData } from '../types/index.js'
import { getMockTranscripts } from './mockData.js'

const log = createLogger('fetch')

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

export interface TranscriptPair {
  current: TranscriptData
  prior: TranscriptData
}

function useMockFetch(): boolean {
  return process.env.USE_MOCK_FETCH === 'true' || process.env.NODE_ENV === 'test'
}

// Fetch the Motley Fool quote page for a ticker.
// Transcript paths are embedded in the page's JSON payload — no JS rendering needed.
// Tries nasdaq then nyse since the exchange is part of the URL.
async function fetchQuotePage(ticker: string): Promise<string> {
  const sym = ticker.toLowerCase()
  for (const exchange of ['nasdaq', 'nyse']) {
    const res = await fetch(`https://www.fool.com/quote/${exchange}/${sym}/`, { headers: HEADERS })
    if (res.ok) return res.text()
  }
  throw new Error(`Motley Fool quote page not found for ${ticker} (tried nasdaq, nyse)`)
}

async function findTranscriptUrls(ticker: string): Promise<string[]> {
  const html = await fetchQuotePage(ticker)

  // Transcript paths appear as JSON string values in the page payload
  const seen = new Set<string>()
  const urls: string[] = []
  for (const match of html.matchAll(/earnings\/call-transcripts\/(\d{4}\/\d{2}\/\d{2}\/[^"\\]+)/g)) {
    const url = `https://www.fool.com/${match[0]}`
    if (!seen.has(url)) {
      seen.add(url)
      urls.push(url)
    }
  }

  return urls.slice(0, 4)
}

// Scrape one Motley Fool transcript page.
// Verified structure from live pages: section headers "Prepared Remarks:" and
// "Questions and Answers:" appear as plain text markers in the article body.
async function scrapeTranscript(url: string): Promise<TranscriptData> {
  await new Promise(r => setTimeout(r, 600)) // polite delay

  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  // Extract only the transcript section — content after #full-conference-call-transcript h2,
  // stopping at the next h2 ("Read Next"). This avoids pulling in nav/chrome/summaries.
  const transcriptHeader = $('#full-conference-call-transcript')
  if (!transcriptHeader.length) throw new Error(`Transcript section not found at ${url}`)

  const paragraphs: string[] = []
  transcriptHeader.nextUntil('h2').each((_, el) => {
    const text = $(el).text().trim()
    if (text) paragraphs.push(text)
  })

  const cleaned = paragraphs.join('\n\n')

  // Q&A starts when the operator opens the floor for questions.
  // Motley Fool transcripts don't use a section header — find the operator transition line.
  const qaMarkers = [
    /open the call for questions/i,
    /will now take questions/i,
    /will take questions/i,
    /open for questions/i,
    /question-and-answer session/i,
  ]

  let splitIndex = -1
  for (const marker of qaMarkers) {
    const match = cleaned.search(marker)
    if (match !== -1 && (splitIndex === -1 || match < splitIndex)) {
      splitIndex = match
    }
  }

  // Walk back to the start of the operator's paragraph so it lands in Q&A, not prepared
  const adjustedSplit = splitIndex !== -1
    ? cleaned.lastIndexOf('\n\n', splitIndex) + 2
    : -1

  const preparedRemarks =
    adjustedSplit !== -1 ? cleaned.slice(0, adjustedSplit).trim() : cleaned
  const questionsAndAnswers =
    adjustedSplit !== -1 ? cleaned.slice(adjustedSplit).trim() : ''

  const titleEl = $('h1').first().text().trim()
  const { quarter, date } = extractQuarterAndDate(url, titleEl)

  return { preparedRemarks, questionsAndAnswers, date, quarter }
}

// URL pattern: /call-transcripts/2025/01/30/apple-aapl-q1-2025-...
// Title pattern: "Apple (AAPL) Q1 2025 Earnings Call Transcript"
function extractQuarterAndDate(url: string, title: string): { quarter: string; date: string } {
  const urlMatch = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//)
  const date = urlMatch
    ? `${urlMatch[1]}-${urlMatch[2]}-${urlMatch[3]}`
    : new Date().toISOString().slice(0, 10)

  const quarterMatch = title.match(/Q([1-4])\s+(\d{4})/i)
  const quarter = quarterMatch
    ? `Q${quarterMatch[1]} ${quarterMatch[2]}`
    : deriveQuarterFromDate(date)

  return { quarter, date }
}


function deriveQuarterFromDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  const q = month <= 3 ? 4 : month <= 6 ? 1 : month <= 9 ? 2 : 3
  const reportYear = month <= 3 ? year - 1 : year
  return `Q${q} ${reportYear}`
}

export async function fetchTranscripts(ticker: string): Promise<TranscriptPair> {
  const sym = ticker.toUpperCase()

  if (useMockFetch()) {
    log.info('using mock transcripts', { ticker: sym })
    return getMockTranscripts(ticker)
  }

  log.info('fetching transcripts from Motley Fool', { ticker: sym })
  try {
    let urls = await findTranscriptUrls(sym)
    log.info('transcript URLs found', { ticker: sym, count: urls.length })

    if (urls.length === 0) throw new Error(`No transcript URLs found for ${sym}`)

    const current = await scrapeTranscript(urls[0])
    log.info('transcript scraped', { ticker: sym, quarter: current.quarter })

    if (urls.length < 2) {
      throw new Error(`Could not find prior quarter transcript for ${sym} (found ${urls.length})`)
    }

    const prior = await scrapeTranscript(urls[1])
    log.info('transcript scraped', { ticker: sym, quarter: prior.quarter })

    log.info('transcripts fetched', {
      ticker: sym,
      currentQuarter: current.quarter,
      priorQuarter: prior.quarter,
    })

    return { current, prior }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    log.warn('Motley Fool fetch failed, using mock', { ticker: sym, error })
    return getMockTranscripts(ticker)
  }
}
