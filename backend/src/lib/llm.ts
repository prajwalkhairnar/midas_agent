import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createLogger } from './logger.js'
import type { Provider } from '../types/index.js'

const log = createLogger('llm')

export interface LLMCallConfig {
  provider: Provider
  model: string
  systemPrompt: string
  userMessage: string
  temperature?: number
  maxTokens?: number
  /** Request strict JSON from OpenAI-compatible providers (Groq, NVIDIA). */
  jsonMode?: boolean
}

export interface StreamLLMConfig {
  provider: Provider
  model: string
  systemPrompt: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  temperature?: number
  maxTokens?: number
}

function useMockLLM(): boolean {
  return process.env.USE_MOCK_LLM === 'true' || process.env.NODE_ENV === 'test'
}

export async function callLLM(config: LLMCallConfig): Promise<string> {
  const step = inferStepLabel(config.systemPrompt)
  const start = Date.now()

  if (useMockLLM()) {
    return mockLLMResponse(config)
  }

  const {
    provider,
    model,
    systemPrompt,
    userMessage,
    temperature = 0.3,
    maxTokens = 2000,
    jsonMode = false,
  } = config

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic')
    const text = block.text
    log.info('llm call completed', {
      step,
      provider,
      durationMs: Date.now() - start,
      chars: text.length,
    })
    return text
  }

  const baseURLMap: Record<string, string> = {
    groq: 'https://api.groq.com/openai/v1',
    nvidia: 'https://integrate.api.nvidia.com/v1',
  }
  const apiKeyMap: Record<string, string | undefined> = {
    groq: process.env.GROQ_API_KEY,
    nvidia: process.env.NVIDIA_API_KEY,
  }

  const apiKey = apiKeyMap[provider]
  if (!apiKey) throw new Error(`${provider.toUpperCase()} API key not configured`)

  const client = new OpenAI({
    baseURL: baseURLMap[provider],
    apiKey,
  })

  const response = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    ...(jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })

  const text = response.choices[0]?.message?.content ?? ''
  log.info('llm call completed', {
    step,
    provider,
    durationMs: Date.now() - start,
    responseChars: text.length,
  })
  return text
}

function inferStepLabel(systemPrompt: string): string {
  const s = systemPrompt.toLowerCase()
  if (s.includes('extracting structured')) return 'extract'
  if (s.includes('forensic linguist')) return 'tone'
  if (s.includes('short-seller')) return 'redflags'
  if (s.includes('post-earnings note')) return 'synthesis'
  if (s.includes('equity research report')) return 'report'
  if (s.includes('senior equity analyst')) return 'chat'
  return 'unknown'
}

export async function* streamLLM(config: StreamLLMConfig): AsyncGenerator<string> {
  const start = Date.now()
  if (useMockLLM()) {
    const text = mockLLMResponse({
      provider: config.provider,
      model: config.model,
      systemPrompt: config.systemPrompt,
      userMessage: config.messages.at(-1)?.content ?? '',
    })
    for (const word of text.split(' ')) {
      yield word + ' '
    }
    return
  }

  const { provider, model, systemPrompt, messages, temperature = 0.3, maxTokens = 2000 } = config

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
    const client = new Anthropic({ apiKey })
    const stream = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })
    let chars = 0
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        chars += event.delta.text.length
        yield event.delta.text
      }
    }
    log.info('llm stream completed', { provider, durationMs: Date.now() - start, responseChars: chars })
    return
  }

  const baseURLMap: Record<string, string> = {
    groq: 'https://api.groq.com/openai/v1',
    nvidia: 'https://integrate.api.nvidia.com/v1',
  }
  const apiKeyMap: Record<string, string | undefined> = {
    groq: process.env.GROQ_API_KEY,
    nvidia: process.env.NVIDIA_API_KEY,
  }
  const apiKey = apiKeyMap[provider]
  if (!apiKey) throw new Error(`${provider.toUpperCase()} API key not configured`)

  const client = new OpenAI({ baseURL: baseURLMap[provider], apiKey })
  const stream = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    stream: true,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  })

  let chars = 0
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) {
      chars += delta.length
      yield delta
    }
  }
  log.info('llm stream completed', { provider, durationMs: Date.now() - start, responseChars: chars })
}

function mockLLMResponse(config: LLMCallConfig): string {
  const system = config.systemPrompt.toLowerCase()
  const user = config.userMessage.toLowerCase()

  if (system.includes('extracting structured')) {
    return JSON.stringify({
      guidanceStatements: [
        {
          text: 'We expect revenue growth in the mid-teens range for the full year.',
          speaker: 'CEO',
          topic: 'revenue guidance',
          sentiment: 'positive',
          sourceSection: 'prepared',
          charOffset: 120,
        },
      ],
      keyMetrics: [{ name: 'Revenue', value: '$95.4B', vsEstimate: 'beat' }],
      topicsDiscussed: ['AI', 'services', 'margin expansion'],
    })
  }
  if (system.includes('forensic linguist')) {
    return JSON.stringify({
      overallShift: 'more_cautious',
      shiftSummary: 'Management used more hedging language on macro demand.',
      languageChanges: [
        {
          topic: 'demand',
          currentLanguage: 'we remain thoughtful about the environment',
          priorLanguage: 'we see strong demand across our portfolio',
          significance: 'high',
        },
      ],
      topicsDropped: ['unit growth acceleration'],
      topicsAdded: ['inventory normalization'],
    })
  }
  if (system.includes('short-seller')) {
    return JSON.stringify({
      redFlags: [
        {
          text: 'Guidance range widened while headline beat was emphasized',
          type: 'hedged_language',
          severity: 'medium',
          evidence: 'we remain thoughtful about the environment',
          charOffset: 450,
        },
      ],
    })
  }
  if (system.includes('equity research report')) {
    return `# AAPL — Q4 2024 Earnings Analysis\n\n## Executive Summary\nMock report for testing.\n`
  }
  if (system.includes('post-earnings note')) {
    return JSON.stringify({
      headline: 'Beat on revenue with cautious forward tone',
      keyTakeaways: ['Revenue beat consensus', 'Guidance language softened QoQ'],
      bullSignals: ['Services growth accelerated'],
      bearSignals: ['Wider guidance range'],
      followUpQuestions: ['What drives margin expansion in FY25?'],
      overallSentiment: 'neutral',
    })
  }
  return 'This is a mock assistant response grounded in the earnings analysis.'
}
