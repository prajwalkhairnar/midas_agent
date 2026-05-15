import { Router } from 'express'
import { deleteSession, getSession, listSessions } from '../db/supabase.js'

export const sessionsRouter = Router()

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
    res.status(500).json({ error: String(err) })
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
    res.status(204).send()
  } catch {
    res.status(404).json({ error: 'Session not found' })
  }
})
