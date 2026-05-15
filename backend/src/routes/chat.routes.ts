import { Router } from 'express'
import { buildChatSystemPrompt } from '../agent/synthesise.js'
import { appendMessages, getSession } from '../db/supabase.js'
import { streamLLM } from '../lib/llm.js'
import { DEFAULT_MODELS } from '../lib/utils.js'
import type { Provider } from '../types/index.js'

export const chatRouter = Router()

chatRouter.post('/message', async (req, res) => {
  const sessionId = String(req.body.sessionId ?? '')
  const userMessage = String(req.body.userMessage ?? '').trim()
  const provider = req.body.provider as Provider
  const model = String(req.body.model ?? DEFAULT_MODELS[provider] ?? '')
  const userSessionId = String(req.headers['x-user-session-id'] ?? '')

  if (!sessionId || !userMessage || !provider || !model || !userSessionId) {
    res.status(400).json({ error: 'sessionId, userMessage, provider, model, and session header required' })
    return
  }

  const session = await getSession(sessionId, userSessionId)
  const systemPrompt = buildChatSystemPrompt(session.analysisResult)
  const history = session.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  let assembled = ''
  try {
    const stream = streamLLM({
      provider,
      model,
      systemPrompt,
      messages: [...history, { role: 'user', content: userMessage }],
    })
    for await (const chunk of stream) {
      assembled += chunk
      res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`)
    }

    await appendMessages(sessionId, userSessionId, [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assembled, provider },
    ])
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
  } finally {
    res.end()
  }
})
