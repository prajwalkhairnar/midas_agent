import type { NextFunction, Request, Response } from 'express'
import { createLogger } from '../lib/logger.js'

const log = createLogger('http')

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()
  res.on('finish', () => {
    log.info('request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
    })
  })
  next()
}
