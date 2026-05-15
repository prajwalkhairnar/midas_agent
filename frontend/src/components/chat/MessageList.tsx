import ReactMarkdown from 'react-markdown'
import { ProviderBadge } from './ProviderBadge'
import type { Message } from '@/types'

export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`rounded-lg px-4 py-3 text-sm ${
            m.role === 'user' ? 'ml-8 bg-primary text-primary-foreground' : 'mr-8 bg-muted'
          }`}
        >
          {m.role === 'assistant' ? (
            <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{m.content}</ReactMarkdown>
          ) : (
            m.content
          )}
          {m.role === 'assistant' && (
            <div className="mt-2">
              <ProviderBadge provider={m.provider} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
