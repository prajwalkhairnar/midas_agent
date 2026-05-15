import { Router } from 'express'
import { runPipeline } from '../agent/orchestrator.js'
import { DEFAULT_MODELS, getConfiguredProviders } from '../lib/utils.js'
import type { Provider, SSEEvent } from '../types/index.js'

export const pipelineRouter = Router()

pipelineRouter.get('/providers', (_req, res) => {
  const providers = getConfiguredProviders()
  const models = Object.fromEntries(
    providers.map((p) => [p, DEFAULT_MODELS[p] ?? '']),
  )
  res.json({ providers, models })
})

pipelineRouter.post('/run', async (req, res) => {
  const ticker = String(req.body.ticker ?? '').trim()
  const provider = req.body.provider as Provider
  const model = String(req.body.model ?? DEFAULT_MODELS[provider] ?? '')
  const userSessionId = String(req.headers['x-user-session-id'] ?? '')

  if (!ticker) {
    res.status(400).json({ error: 'ticker is required' })
    return
  }
  if (!provider || !model) {
    res.status(400).json({ error: 'provider and model are required' })
    return
  }
  if (!userSessionId) {
    res.status(400).json({ error: 'x-user-session-id header is required' })
    return
  }

  const configured = getConfiguredProviders()
  if (!configured.includes(provider) && process.env.USE_MOCK_LLM !== 'true') {
    res.status(400).json({ error: 'Provider not configured' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const emit = (event: SSEEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  try {
    await runPipeline({ ticker, provider, model, userSessionId, emit })
  } catch (err) {
    emit({ step: 'complete', status: 'error', detail: String(err) })
  } finally {
    res.end()
  }
})
