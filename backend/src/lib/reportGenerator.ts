import { callLLM } from './llm.js'
import { loadPrompt } from './utils.js'
import type { AnalysisResult, LLMConfig } from '../types/index.js'

export async function generateReport(
  result: AnalysisResult,
  llmConfig: LLMConfig,
): Promise<string> {
  const systemPrompt = loadPrompt('report')
  const userMessage = `Generate a full markdown analyst report for ${result.ticker} ${result.quarter}.

Use this analysis data:
${JSON.stringify(result, null, 2)}

The report should follow this structure:
# ${result.ticker} — ${result.quarter} Earnings Analysis

## Executive Summary
## Key Financial Metrics
## Guidance & Forward Outlook
## Tone Analysis: ${result.quarter} vs Prior Quarter
## Red Flags & Risk Factors
## Bull Case
## Bear Case
## Follow-Up Questions for Next Call

Write in a professional equity research style. Be specific and cite transcript evidence.`

  return callLLM({ ...llmConfig, systemPrompt, userMessage, maxTokens: 3000 })
}
