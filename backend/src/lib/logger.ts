type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogMeta = Record<string, unknown>

function formatMeta(meta?: LogMeta): string {
  if (!meta || Object.keys(meta).length === 0) return ''
  return ` ${JSON.stringify(meta)}`
}

function write(level: LogLevel, scope: string, message: string, meta?: LogMeta): void {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${scope}] ${message}${formatMeta(meta)}`
  if (level === 'error') {
    console.error(line)
    return
  }
  if (level === 'warn') {
    console.warn(line)
    return
  }
  console.log(line)
}

export interface Logger {
  debug: (message: string, meta?: LogMeta) => void
  info: (message: string, meta?: LogMeta) => void
  warn: (message: string, meta?: LogMeta) => void
  error: (message: string, meta?: LogMeta) => void
}

export function createLogger(scope: string): Logger {
  return {
    debug: (message, meta) => write('debug', scope, message, meta),
    info: (message, meta) => write('info', scope, message, meta),
    warn: (message, meta) => write('warn', scope, message, meta),
    error: (message, meta) => write('error', scope, message, meta),
  }
}

export async function timeAsync<T>(
  log: Logger,
  label: string,
  fn: () => Promise<T>,
  meta?: LogMeta,
): Promise<T> {
  const start = Date.now()
  log.info(`${label} started`, meta)
  try {
    const result = await fn()
    log.info(`${label} completed`, { ...meta, durationMs: Date.now() - start })
    return result
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    log.error(`${label} failed`, { ...meta, durationMs: Date.now() - start, error })
    throw err
  }
}
