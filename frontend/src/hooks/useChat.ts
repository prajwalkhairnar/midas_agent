import { useCallback, useState } from 'react'
import { getUserSessionId } from '@/lib/userSession'
import { getBackendUrl } from '@/services/api'
import type { Message, Provider } from '@/types'

export function useChat(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [streaming, setStreaming] = useState(false)

  const send = useCallback(
    async (sessionId: string, userMessage: string, provider: Provider, model: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString(),
      }
      setMessages((m) => [...m, userMsg])
      setStreaming(true)

      const assistantId = crypto.randomUUID()
      setMessages((m) => [
        ...m,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          provider,
          createdAt: new Date().toISOString(),
        },
      ])

      const res = await fetch(`${getBackendUrl()}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session-id': getUserSessionId(),
        },
        body: JSON.stringify({ sessionId, userMessage, provider, model }),
      })

      if (!res.ok || !res.body) {
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = JSON.parse(line.slice(6)) as { delta?: string; error?: string }
          if (payload.error) continue
          if (payload.delta) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + payload.delta } : m,
              ),
            )
          }
        }
      }
      setStreaming(false)
    },
    [],
  )

  return { messages, setMessages, streaming, send }
}
