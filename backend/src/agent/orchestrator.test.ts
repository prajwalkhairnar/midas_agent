import { beforeEach, describe, expect, it } from 'vitest'
import { runPipeline } from './orchestrator.js'
import { clearMockDb } from '../db/supabase.js'
import type { SSEEvent } from '../types/index.js'

describe('runPipeline', () => {
  beforeEach(() => {
    process.env.USE_MOCK_LLM = 'true'
    process.env.USE_MOCK_DB = 'true'
    process.env.USE_MOCK_FETCH = 'true'
    clearMockDb()
  })

  it('emits all pipeline steps and completes with analysis data', async () => {
    const events: SSEEvent[] = []
    await runPipeline({
      ticker: 'AAPL',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      userSessionId: 'test-user',
      emit: (e) => events.push(e),
    })

    const steps = events.map((e) => e.step)
    expect(steps).toContain('fetching')
    expect(steps).toContain('extracting')
    expect(steps).toContain('tone')
    expect(steps).toContain('redflags')
    expect(steps).toContain('synthesis')
    expect(steps).toContain('complete')

    const complete = events.find((e) => e.step === 'complete')
    expect(complete?.status).toBe('done')
    expect(complete?.data?.ticker).toBe('AAPL')
    expect(complete?.sessionId).toBeTruthy()
    expect(complete?.data?.analystNote.headline).toBeTruthy()
  })
})
