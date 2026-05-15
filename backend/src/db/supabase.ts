import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  AnalysisResult,
  Message,
  Provider,
  Session,
} from '../types/index.js'
import { buildInitialAssistantMessage } from '../agent/synthesise.js'

interface SessionRow {
  id: string
  ticker: string
  quarter: string
  title: string
  provider: string
  model: string
  analysis_result: AnalysisResult
  report_md: string | null
  report_generated_at: string | null
  user_session_id: string
  created_at: string
  updated_at: string
}

interface MessageRow {
  id: string
  session_id: string
  role: string
  content: string
  provider: string | null
  created_at: string
}

const memory = {
  sessions: new Map<string, SessionRow>(),
  messages: new Map<string, MessageRow[]>(),
}

function useMockDb(): boolean {
  return (
    process.env.USE_MOCK_DB === 'true' ||
    process.env.NODE_ENV === 'test' ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function getClient(): SupabaseClient | null {
  if (useMockDb()) return null
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function rowToSession(row: SessionRow, messages: Message[]): Session {
  return {
    id: row.id,
    ticker: row.ticker,
    quarter: row.quarter,
    title: row.title,
    provider: row.provider as Provider,
    model: row.model,
    analysisResult: row.analysis_result,
    messages,
    reportMd: row.report_md ?? undefined,
    reportGeneratedAt: row.report_generated_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function saveSession(params: {
  ticker: string
  quarter: string
  provider: Provider
  model: string
  result: AnalysisResult
  userSessionId: string
}): Promise<Session> {
  const title = `${params.ticker.toUpperCase()} ${params.quarter} Analysis`
  const initialContent = buildInitialAssistantMessage(params.result)
  const now = new Date().toISOString()

  if (useMockDb()) {
    const id = crypto.randomUUID()
    const row: SessionRow = {
      id,
      ticker: params.ticker.toUpperCase(),
      quarter: params.quarter,
      title,
      provider: params.provider,
      model: params.model,
      analysis_result: params.result,
      report_md: null,
      report_generated_at: null,
      user_session_id: params.userSessionId,
      created_at: now,
      updated_at: now,
    }
    memory.sessions.set(id, row)
    const msg: MessageRow = {
      id: crypto.randomUUID(),
      session_id: id,
      role: 'assistant',
      content: initialContent,
      provider: params.provider,
      created_at: now,
    }
    memory.messages.set(id, [msg])
    return rowToSession(row, [mapMessage(msg)])
  }

  const client = getClient()!
  const { data: sessionData, error } = await client
    .from('sessions')
    .insert({
      ticker: params.ticker.toUpperCase(),
      quarter: params.quarter,
      title,
      provider: params.provider,
      model: params.model,
      analysis_result: params.result,
      user_session_id: params.userSessionId,
    })
    .select()
    .single()

  if (error) throw error

  await client.from('messages').insert({
    session_id: sessionData.id,
    role: 'assistant',
    content: initialContent,
    provider: params.provider,
  })

  return getSession(sessionData.id, params.userSessionId)
}

export async function getSession(sessionId: string, userSessionId: string): Promise<Session> {
  if (useMockDb()) {
    const row = memory.sessions.get(sessionId)
    if (!row || row.user_session_id !== userSessionId) {
      throw new Error('Session not found')
    }
    const msgs = memory.messages.get(sessionId) ?? []
    return rowToSession(
      row,
      msgs.map(mapMessage),
    )
  }

  const client = getClient()!
  const { data: sessionData, error } = await client
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_session_id', userSessionId)
    .single()

  if (error || !sessionData) throw new Error('Session not found')

  const { data: messages } = await client
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  return rowToSession(sessionData as SessionRow, (messages ?? []).map(mapMessage))
}

export async function listSessions(userSessionId: string): Promise<Session[]> {
  if (useMockDb()) {
    return [...memory.sessions.values()]
      .filter((s) => s.user_session_id === userSessionId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((row) =>
        rowToSession(row, (memory.messages.get(row.id) ?? []).map(mapMessage)),
      )
  }

  const client = getClient()!
  const { data, error } = await client
    .from('sessions')
    .select('*')
    .eq('user_session_id', userSessionId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const sessions: Session[] = []
  for (const row of data ?? []) {
    const { data: messages } = await client
      .from('messages')
      .select('*')
      .eq('session_id', row.id)
      .order('created_at', { ascending: true })
    sessions.push(rowToSession(row as SessionRow, (messages ?? []).map(mapMessage)))
  }
  return sessions
}

export async function deleteSession(sessionId: string, userSessionId: string): Promise<void> {
  if (useMockDb()) {
    const row = memory.sessions.get(sessionId)
    if (!row || row.user_session_id !== userSessionId) throw new Error('Session not found')
    memory.sessions.delete(sessionId)
    memory.messages.delete(sessionId)
    return
  }

  const client = getClient()!
  const { error } = await client
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_session_id', userSessionId)

  if (error) throw error
}

export async function appendMessages(
  sessionId: string,
  userSessionId: string,
  items: { role: 'user' | 'assistant'; content: string; provider?: Provider }[],
): Promise<void> {
  if (useMockDb()) {
    const row = memory.sessions.get(sessionId)
    if (!row || row.user_session_id !== userSessionId) throw new Error('Session not found')
    const existing = memory.messages.get(sessionId) ?? []
    for (const item of items) {
      existing.push({
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: item.role,
        content: item.content,
        provider: item.provider ?? null,
        created_at: new Date().toISOString(),
      })
    }
    memory.messages.set(sessionId, existing)
    row.updated_at = new Date().toISOString()
    return
  }

  const client = getClient()!
  const { error } = await client.from('messages').insert(
    items.map((item) => ({
      session_id: sessionId,
      role: item.role,
      content: item.content,
      provider: item.provider ?? null,
    })),
  )
  if (error) throw error

  await client
    .from('sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_session_id', userSessionId)
}

export async function updateSessionReport(
  sessionId: string,
  userSessionId: string,
  reportMd: string,
): Promise<void> {
  const now = new Date().toISOString()
  if (useMockDb()) {
    const row = memory.sessions.get(sessionId)
    if (!row || row.user_session_id !== userSessionId) throw new Error('Session not found')
    row.report_md = reportMd
    row.report_generated_at = now
    row.updated_at = now
    return
  }

  const client = getClient()!
  const { error } = await client
    .from('sessions')
    .update({ report_md: reportMd, report_generated_at: now, updated_at: now })
    .eq('id', sessionId)
    .eq('user_session_id', userSessionId)

  if (error) throw error
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    role: row.role as Message['role'],
    content: row.content,
    provider: (row.provider as Provider) ?? undefined,
    createdAt: row.created_at,
  }
}

export function clearMockDb(): void {
  memory.sessions.clear()
  memory.messages.clear()
}
