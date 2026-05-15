import { useEffect, useState } from 'react'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { generateReport, fetchProviders } from '@/services/api'
import { useChat } from '@/hooks/useChat'
import type { Provider, Session } from '@/types'

export function ChatInterface({ session }: { session: Session }) {
  const { messages, setMessages, streaming, send } = useChat(session.messages)
  const [provider, setProvider] = useState(session.provider)
  const [model, setModel] = useState(session.model)
  const [providers, setProviders] = useState<Provider[]>([session.provider])
  const [models, setModels] = useState<Record<string, string>>({})
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    setMessages(session.messages)
    setProvider(session.provider)
    setModel(session.model)
  }, [session, setMessages])

  useEffect(() => {
    fetchProviders().then((d) => {
      setProviders(d.providers as Provider[])
      setModels(d.models)
    })
  }, [])

  const handleReport = async () => {
    setReportLoading(true)
    try {
      const md = await generateReport(session.id, provider, model)
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: md,
          provider,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <MessageList messages={messages} />
      <MessageInput
        provider={provider}
        model={model}
        providers={providers}
        models={models}
        disabled={streaming}
        reportLoading={reportLoading}
        onSend={(msg, p, m) => send(session.id, msg, p, m)}
        onGenerateReport={handleReport}
        onProviderChange={(p, m) => {
          setProvider(p)
          setModel(m)
        }}
      />
    </div>
  )
}
