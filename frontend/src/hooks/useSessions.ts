import { useCallback, useEffect, useState } from 'react'
import { deleteSession, listSessions } from '@/services/api'
import type { Session } from '@/types'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listSessions()
      setSessions(data)
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const remove = useCallback(
    async (id: string) => {
      await deleteSession(id)
      setSessions((s) => s.filter((x) => x.id !== id))
    },
    [],
  )

  return { sessions, loading, refresh, remove }
}
