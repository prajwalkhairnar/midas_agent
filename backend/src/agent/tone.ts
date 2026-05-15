import { callLLM } from '../lib/llm.js'
import { loadPrompt, parseJsonFromLLM } from '../lib/utils.js'
import type { LLMConfig, ToneResult, TranscriptData } from '../types/index.js'

export async function analyseTone(
  current: TranscriptData,
  prior: TranscriptData,
  llmConfig: LLMConfig,
): Promise<ToneResult> {
  const systemPrompt = loadPrompt('tone')
  const userMessage = `Current (${current.quarter}):
Prepared: ${current.preparedRemarks}
Q&A: ${current.questionsAndAnswers}

Prior (${prior.quarter}):
Prepared: ${prior.preparedRemarks}
Q&A: ${prior.questionsAndAnswers}`

  const raw = await callLLM({
    ...llmConfig,
    systemPrompt,
    userMessage,
    maxTokens: 2000,
    jsonMode: true,
  })

  try {
    return parseJsonFromLLM<ToneResult>(raw)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Tone analysis returned invalid JSON: ${message}`)
  }
}
