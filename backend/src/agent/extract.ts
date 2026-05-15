import { callLLM } from '../lib/llm.js'
import { loadPrompt, parseJsonFromLLM } from '../lib/utils.js'
import type { ExtractionResult, LLMConfig, TranscriptData } from '../types/index.js'

export async function extractStructure(
  transcript: TranscriptData,
  llmConfig: LLMConfig,
): Promise<ExtractionResult> {
  const systemPrompt = loadPrompt('extraction')
  const userMessage = `Ticker quarter: ${transcript.quarter}

Prepared remarks:
${transcript.preparedRemarks}

Q&A:
${transcript.questionsAndAnswers}`

  const raw = await callLLM({
    ...llmConfig,
    systemPrompt,
    userMessage,
    maxTokens: 2500,
    jsonMode: true,
  })

  return parseJsonFromLLM<ExtractionResult>(raw)
}
