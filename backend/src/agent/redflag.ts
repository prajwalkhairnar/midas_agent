import { callLLM } from '../lib/llm.js'
import { loadPrompt, parseJsonFromLLM } from '../lib/utils.js'
import type { LLMConfig, RedFlag, ToneResult, TranscriptData } from '../types/index.js'

export async function detectRedFlags(
  current: TranscriptData,
  prior: TranscriptData,
  tone: ToneResult,
  llmConfig: LLMConfig,
): Promise<RedFlag[]> {
  const systemPrompt = loadPrompt('redflag')
  const userMessage = `Current transcript (${current.quarter}):
${current.preparedRemarks}
${current.questionsAndAnswers}

Prior transcript (${prior.quarter}):
${prior.preparedRemarks}

Tone analysis:
${JSON.stringify(tone, null, 2)}`

  const raw = await callLLM({
    ...llmConfig,
    systemPrompt,
    userMessage,
    maxTokens: 2000,
    jsonMode: true,
  })

  return parseJsonFromLLM<RedFlag[]>(raw)
}
