import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchProviders } from '@/services/api'
import type { Provider } from '@/types'

interface TickerInputProps {
  onSubmit: (ticker: string, provider: Provider, model: string) => void
  disabled?: boolean
}

export function TickerInput({ onSubmit, disabled }: TickerInputProps) {
  const [ticker, setTicker] = useState('AAPL')
  const [provider, setProvider] = useState<Provider>('groq')
  const [model, setModel] = useState('llama-3.3-70b-versatile')
  const [providers, setProviders] = useState<Provider[]>(['groq'])
  const [models, setModels] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchProviders()
      .then((data) => {
        setProviders(data.providers as Provider[])
        setModels(data.models)
        if (data.providers.length > 0) {
          const p = data.providers[0] as Provider
          setProvider(p)
          setModel(data.models[p] ?? '')
        }
      })
      .catch(() => {
        setProviders(['groq'])
        setModels({ groq: 'llama-3.3-70b-versatile' })
      })
  }, [])

  return (
    <Card className="max-w-md mx-auto mt-24">
      <CardHeader>
        <CardTitle>Earnings Analyst</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter a ticker to run the multi-step earnings pipeline.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Ticker (e.g. AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
        />
        <div className="flex gap-2">
          <select
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
            value={provider}
            disabled={providers.length === 0}
            onChange={(e) => {
              const p = e.target.value as Provider
              setProvider(p)
              setModel(models[p] ?? '')
            }}
          >
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <Input className="flex-1" value={model} onChange={(e) => setModel(e.target.value)} />
        </div>
        <Button
          className="w-full"
          disabled={disabled || !ticker.trim()}
          onClick={() => onSubmit(ticker.trim(), provider, model)}
        >
          Run analysis
        </Button>
      </CardContent>
    </Card>
  )
}
