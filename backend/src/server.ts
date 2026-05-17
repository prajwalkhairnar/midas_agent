import './loadEnv.js'
import cors from 'cors'
import express from 'express'
import { createLogger } from './lib/logger.js'
import { getConfiguredProviders } from './lib/utils.js'
import { requestLogger } from './middleware/requestLogger.js'
import { chatRouter } from './routes/chat.routes.js'
import { pipelineRouter } from './routes/pipeline.routes.js'
import { reportRouter } from './routes/report.routes.js'
import { sessionsRouter } from './routes/sessions.routes.js'

const bootLog = createLogger('server')

export function createApp() {
  const app = express()
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3848'

  app.use(requestLogger)
  app.use(
    cors({
      origin: frontendUrl,
      credentials: true,
    }),
  )
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/pipeline', pipelineRouter)
  app.use('/api/chat', chatRouter)
  app.use('/api/report', reportRouter)
  app.use('/api/sessions', sessionsRouter)

  return app
}

const app = createApp()

const isMain =
  process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')

if (isMain && process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3847)
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3848'
  app.listen(port, () => {
    bootLog.info('listening', {
      url: `http://localhost:${port}`,
      frontendUrl,
      providers: getConfiguredProviders(),
      mock: {
        llm: process.env.USE_MOCK_LLM === 'true',
        db: process.env.USE_MOCK_DB === 'true',
        fetch: process.env.USE_MOCK_FETCH === 'true',
      },
    })
  })
}

export default app
