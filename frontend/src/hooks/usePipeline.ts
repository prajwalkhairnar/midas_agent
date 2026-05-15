import { useCallback, useState } from 'react'
import { getUserSessionId } from '@/lib/userSession'
import { getBackendUrl } from '@/services/api'
import type { AnalysisResult, PipelineStep, PipelineStepId, Provider, SSEEvent } from '@/types'

const STEP_LABELS: Record<PipelineStepId, string> = {
  fetching: 'Fetching earnings data',
  extracting: 'Extracting guidance & metrics',
  tone: 'Tone analysis',
  redflags: 'Red flag detection',
  synthesis: 'Writing analyst note',
  complete: 'Complete',
}

const INITIAL_STEPS: PipelineStepId[] = [
  'fetching',
  'extracting',
  'tone',
  'redflags',
  'synthesis',
]

function initSteps(): PipelineStep[] {
  return INITIAL_STEPS.map((id) => ({
    id,
    label: STEP_LABELS[id],
    status: 'pending',
  }))
}

export function usePipeline() {
  const [steps, setSteps] = useState<PipelineStep[]>(initSteps)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const run = useCallback(
    async (ticker: string, provider: Provider, model: string) => {
      setRunning(true)
      setError(null)
      setResult(null)
      setSessionId(null)
      setSteps(initSteps())

      const res = await fetch(`${getBackendUrl()}/api/pipeline/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session-id': getUserSessionId(),
        },
        body: JSON.stringify({ ticker, provider, model }),
      })

      if (!res.ok || !res.body) {
        setError('Failed to start pipeline')
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6)) as SSEEvent
          if (event.step === 'complete') {
            if (event.status === 'error') {
              setError(event.detail ?? 'Pipeline failed')
            } else if (event.data) {
              setResult(event.data)
              setSessionId(event.sessionId ?? null)
            }
            setRunning(false)
            continue
          }
          setSteps((prev) =>
            prev.map((s) =>
              s.id === event.step
                ? { ...s, status: event.status, detail: event.detail }
                : s,
            ),
          )
        }
      }
      setRunning(false)
    },
    [],
  )

  const reset = useCallback(() => {
    setSteps(initSteps())
    setRunning(false)
    setError(null)
    setResult(null)
    setSessionId(null)
  }, [])

  return { steps, running, error, result, sessionId, run, reset }
}
