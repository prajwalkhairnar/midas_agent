import { fetchTranscripts } from './fetch.js'
import { extractStructure } from './extract.js'
import { analyseTone } from './tone.js'
import { detectRedFlags } from './redflag.js'
import { synthesise } from './synthesise.js'
import { saveSession } from '../db/supabase.js'
import type { AnalysisResult, LLMConfig, Provider, SSEEvent } from '../types/index.js'

export interface RunPipelineParams {
  ticker: string
  provider: Provider
  model: string
  userSessionId: string
  emit: (event: SSEEvent) => void
}

export async function runPipeline(params: RunPipelineParams): Promise<void> {
  const { ticker, provider, model, userSessionId, emit } = params
  const llmConfig: LLMConfig = { provider, model }

  emit({ step: 'fetching', status: 'running', detail: `Fetching ${ticker} earnings data...` })
  const transcripts = await fetchTranscripts(ticker)
  emit({
    step: 'fetching',
    status: 'done',
    detail: `Found ${ticker.toUpperCase()} ${transcripts.current.quarter}`,
  })

  emit({
    step: 'extracting',
    status: 'running',
    detail: 'Extracting guidance statements and metrics...',
  })
  const extraction = await extractStructure(transcripts.current, llmConfig)
  emit({
    step: 'extracting',
    status: 'done',
    detail: `${extraction.guidanceStatements.length} guidance statements found`,
  })

  emit({
    step: 'tone',
    status: 'running',
    detail: `Comparing tone vs ${transcripts.prior.quarter}...`,
  })
  const tone = await analyseTone(transcripts.current, transcripts.prior, llmConfig)
  emit({ step: 'tone', status: 'done', detail: `Overall shift: ${tone.overallShift}` })

  emit({
    step: 'redflags',
    status: 'running',
    detail: 'Running adversarial red flag analysis...',
  })
  const redFlags = await detectRedFlags(
    transcripts.current,
    transcripts.prior,
    tone,
    llmConfig,
  )
  const highSeverity = redFlags.filter((f) => f.severity === 'high').length
  emit({
    step: 'redflags',
    status: 'done',
    detail: `${redFlags.length} flags found (${highSeverity} high severity)`,
  })

  emit({ step: 'synthesis', status: 'running', detail: 'Writing analyst note...' })
  const analystNote = await synthesise(extraction, tone, redFlags, llmConfig)
  emit({
    step: 'synthesis',
    status: 'done',
    detail: `Sentiment: ${analystNote.overallSentiment}`,
  })

  const result: AnalysisResult = {
    ticker: ticker.toUpperCase(),
    quarter: transcripts.current.quarter,
    extraction,
    tone,
    redFlags,
    analystNote,
    rawTranscript: transcripts.current,
    priorTranscript: transcripts.prior,
  }

  const session = await saveSession({
    ticker,
    quarter: transcripts.current.quarter,
    provider,
    model,
    result,
    userSessionId,
  })

  emit({ step: 'complete', status: 'done', data: result, sessionId: session.id })
}
