import { describe, expect, it } from 'vitest'
import { createApp } from './server.js'

// supertest not in package - use fetch instead with node test
describe('server', () => {
  it('health check returns ok', async () => {
    const app = createApp()
    const server = app.listen(0)
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0

    const res = await fetch(`http://127.0.0.1:${port}/health`)
    const body = await res.json()
    expect(body).toEqual({ ok: true })

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
  })
})
