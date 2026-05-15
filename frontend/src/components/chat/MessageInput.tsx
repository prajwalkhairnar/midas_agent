import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Provider } from '@/types'

interface MessageInputProps {
  provider: Provider
  model: string
  providers: Provider[]
  models: Record<string, string>
  onSend: (message: string, provider: Provider, model: string) => void
  onGenerateReport: () => void
  onProviderChange: (provider: Provider, model: string) => void
  disabled?: boolean
  reportLoading?: boolean
}

export function MessageInput({
  provider,
  model,
  providers,
  models,
  onSend,
  onGenerateReport,
  onProviderChange,
  disabled,
  reportLoading,
}: MessageInputProps) {
  const [text, setText] = useState('')

  return (
    <div className="border-t border-border p-4 space-y-2">
      <Textarea
        placeholder="Ask about the earnings call..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (text.trim()) {
              onSend(text.trim(), provider, model)
              setText('')
            }
          }
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={disabled || !text.trim()}
          onClick={() => {
            onSend(text.trim(), provider, model)
            setText('')
          }}
        >
          Send
        </Button>
        <Button variant="outline" disabled={reportLoading} onClick={onGenerateReport}>
          {reportLoading ? 'Generating...' : 'Generate Report'}
        </Button>
        <select
          className="ml-auto h-8 rounded-md border border-input bg-background px-2 text-xs"
          value={provider}
          onChange={(e) => {
            const p = e.target.value as Provider
            onProviderChange(p, models[p] ?? model)
          }}
        >
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
