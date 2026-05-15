import { Router } from 'express'
import { getSession, updateSessionReport } from '../db/supabase.js'
import { generateReport } from '../lib/reportGenerator.js'
import { DEFAULT_MODELS } from '../lib/utils.js'
import type { Provider } from '../types/index.js'

export const reportRouter = Router()

reportRouter.post('/generate', async (req, res) => {
  const sessionId = String(req.body.sessionId ?? '')
  const provider = req.body.provider as Provider
  const model = String(req.body.model ?? DEFAULT_MODELS[provider] ?? '')
  const userSessionId = String(req.headers['x-user-session-id'] ?? '')

  if (!sessionId || !provider || !model || !userSessionId) {
    res.status(400).json({ error: 'sessionId, provider, model, and session header required' })
    return
  }

  try {
    const session = await getSession(sessionId, userSessionId)
    const reportMd = await generateReport(session.analysisResult, { provider, model })
    await updateSessionReport(sessionId, userSessionId, reportMd)
    res.json({ reportMd })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})
