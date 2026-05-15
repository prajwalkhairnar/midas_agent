export type Provider = 'anthropic' | 'groq' | 'nvidia'

export interface ProviderConfig {
  provider: Provider
  model: string
  apiKey: string
}

export type PipelineStepId =
  | 'fetching'
  | 'extracting'
  | 'tone'
  | 'redflags'
  | 'synthesis'
  | 'complete'

export type StepStatus = 'pending' | 'running' | 'done' | 'error'

export interface PipelineStep {
  id: PipelineStepId
  label: string
  status: StepStatus
  detail?: string
  durationMs?: number
}

export interface SSEEvent {
  step: PipelineStepId
  status: StepStatus
  detail?: string
  data?: AnalysisResult
  sessionId?: string
}

export interface TranscriptData {
  preparedRemarks: string
  questionsAndAnswers: string
  date: string
  quarter: string
}

export interface GuidanceStatement {
  text: string
  speaker: string
  topic: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'hedged'
  sourceSection: 'prepared' | 'qa'
  charOffset: number
}

export interface ExtractionResult {
  guidanceStatements: GuidanceStatement[]
  keyMetrics: { name: string; value: string; vsEstimate?: string }[]
  topicsDiscussed: string[]
}

export interface ToneResult {
  overallShift: 'more_positive' | 'neutral' | 'more_cautious'
  shiftSummary: string
  languageChanges: {
    topic: string
    currentLanguage: string
    priorLanguage: string
    significance: 'high' | 'medium' | 'low'
  }[]
  topicsDropped: string[]
  topicsAdded: string[]
}

export interface RedFlag {
  text: string
  type: 'deflection' | 'guidance_cut' | 'missing_topic' | 'hedged_language' | 'analyst_pushback'
  severity: 'high' | 'medium' | 'low'
  evidence: string
  charOffset: number
}

export interface AnalystNote {
  headline: string
  keyTakeaways: string[]
  bullSignals: string[]
  bearSignals: string[]
  followUpQuestions: string[]
  overallSentiment: 'bullish' | 'neutral' | 'bearish'
}

export interface AnalysisResult {
  ticker: string
  quarter: string
  extraction: ExtractionResult
  tone: ToneResult
  redFlags: RedFlag[]
  analystNote: AnalystNote
  rawTranscript: TranscriptData
  priorTranscript: TranscriptData
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  provider?: Provider
  createdAt: string
}

export interface Session {
  id: string
  ticker: string
  quarter: string
  title: string
  provider: Provider
  model: string
  analysisResult: AnalysisResult
  messages: Message[]
  reportMd?: string
  reportGeneratedAt?: string
  createdAt: string
  updatedAt: string
}

export interface LLMConfig {
  provider: Provider
  model: string
}
