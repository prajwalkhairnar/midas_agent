import { getUserSessionId } from '@/lib/userSession'
import type { Provider, Session } from '@/types'

const BASE = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3847'

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-user-session-id': getUserSessionId(),
  }
}

export async function fetchProviders(): Promise<{
  providers: Provider[]
  models: Record<string, string>
}> {
  const res = await fetch(`${BASE}/api/pipeline/providers`)
  if (!res.ok) throw new Error('Failed to load providers')
  return res.json()
}

export async function listSessions(): Promise<Session[]> {
  const res = await fetch(`${BASE}/api/sessions`, { headers: headers() })
  if (!res.ok) throw new Error('Failed to load sessions')
  const data = await res.json()
  return data.sessions
}

export async function getSession(id: string): Promise<Session> {
  const res = await fetch(`${BASE}/api/sessions/${id}`, { headers: headers() })
  if (!res.ok) throw new Error('Session not found')
  const data = await res.json()
  return data.session
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/sessions/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) throw new Error('Failed to delete session')
}

export async function generateReport(
  sessionId: string,
  provider: Provider,
  model: string,
): Promise<string> {
  const res = await fetch(`${BASE}/api/report/generate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ sessionId, provider, model }),
  })
  if (!res.ok) throw new Error('Failed to generate report')
  const data = await res.json()
  return data.reportMd
}

export function getBackendUrl(): string {
  return BASE
}
