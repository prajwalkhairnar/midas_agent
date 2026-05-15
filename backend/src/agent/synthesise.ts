import { callLLM } from '../lib/llm.js'
import { loadPrompt, parseJsonFromLLM } from '../lib/utils.js'
import type {
  AnalysisResult,
  AnalystNote,
  ExtractionResult,
  LLMConfig,
  RedFlag,
  ToneResult,
} from '../types/index.js'

export async function synthesise(
  extraction: ExtractionResult,
  tone: ToneResult,
  redFlags: RedFlag[],
  llmConfig: LLMConfig,
): Promise<AnalystNote> {
  const systemPrompt = loadPrompt('synthesis')
  const userMessage = `Extraction:
${JSON.stringify(extraction, null, 2)}

Tone:
${JSON.stringify(tone, null, 2)}

Red flags:
${JSON.stringify(redFlags, null, 2)}`

  const raw = await callLLM({
    ...llmConfig,
    systemPrompt,
    userMessage,
    maxTokens: 2000,
    jsonMode: true,
  })

  return parseJsonFromLLM<AnalystNote>(raw)
}

export function buildChatSystemPrompt(result: AnalysisResult): string {
  const base = loadPrompt('chat-system')
  return `${base}

You are an expert equity research analyst. You have just completed a detailed analysis of ${result.ticker}'s ${result.quarter} earnings call.

OVERALL SENTIMENT: ${result.analystNote.overallSentiment}
HEADLINE: ${result.analystNote.headline}

KEY TAKEAWAYS:
${result.analystNote.keyTakeaways.map((t) => `- ${t}`).join('\n')}

GUIDANCE STATEMENTS EXTRACTED (${result.extraction.guidanceStatements.length} total):
${JSON.stringify(result.extraction.guidanceStatements, null, 2)}

TONE ANALYSIS:
${JSON.stringify(result.tone, null, 2)}

RED FLAGS IDENTIFIED (${result.redFlags.length} total):
${JSON.stringify(result.redFlags, null, 2)}

FULL TRANSCRIPT (Prepared Remarks):
${result.rawTranscript.preparedRemarks}

FULL TRANSCRIPT (Q&A):
${result.rawTranscript.questionsAndAnswers}

Answer the user's questions grounded strictly in this analysis and transcript.
Cite specific passages when relevant. If something is not covered in the analysis, say so clearly.
Be direct and opinionated — you are a senior analyst, not a summariser.`.trim()
}

export function buildInitialAssistantMessage(result: AnalysisResult): string {
  const highSeverity = result.redFlags.filter((f) => f.severity === 'high').length
  return `I've completed my analysis of ${result.ticker} ${result.quarter}. Here's the headline:

**${result.analystNote.headline}**

Key takeaways:
${result.analystNote.keyTakeaways.map((t) => `- ${t}`).join('\n')}

I've flagged ${result.redFlags.length} red flags, ${highSeverity} of which are high severity.
Ask me anything about the transcript, the numbers, or the risks.`
}
