import { Router } from 'express'
import { deleteSession, getSession, listSessions } from '../db/supabase.js'
import { createLogger } from '../lib/logger.js'

export const sessionsRouter = Router()
const log = createLogger('api.sessions')

sessionsRouter.get('/', async (req, res) => {
  const userSessionId = String(req.headers['x-user-session-id'] ?? '')
  if (!userSessionId) {
    res.status(400).json({ error: 'x-user-session-id header is required' })
    return
  }
  try {
    const sessions = await listSessions(userSessionId)
    res.json({ sessions })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('list sessions failed', { error: message })
    res.status(500).json({ error: message })
  }
})

sessionsRouter.get('/:id', async (req, res) => {
  const userSessionId = String(req.headers['x-user-session-id'] ?? '')
  if (!userSessionId) {
    res.status(400).json({ error: 'x-user-session-id header is required' })
    return
  }
  try {
    const session = await getSession(req.params.id, userSessionId)
    res.json({ session })
  } catch {
    log.warn('session not found', { sessionId: req.params.id })
    res.status(404).json({ error: 'Session not found' })
  }
})

sessionsRouter.delete('/:id', async (req, res) => {
  const userSessionId = String(req.headers['x-user-session-id'] ?? '')
  if (!userSessionId) {
    res.status(400).json({ error: 'x-user-session-id header is required' })
    return
  }
  try {
    await deleteSession(req.params.id, userSessionId)
    log.info('session deleted', { sessionId: req.params.id })
    res.status(204).send()
  } catch {
    log.warn('delete failed: session not found', { sessionId: req.params.id })
    res.status(404).json({ error: 'Session not found' })
  }
})
