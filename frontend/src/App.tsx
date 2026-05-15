import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { TranscriptPane } from '@/components/analysis/TranscriptPane'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { PipelineStream } from '@/components/pipeline/PipelineStream'
import { TickerInput } from '@/components/pipeline/TickerInput'
import { getSession } from '@/services/api'
import { usePipeline } from '@/hooks/usePipeline'
import { useSessions } from '@/hooks/useSessions'
import type { Session } from '@/types'

type View = 'input' | 'pipeline' | 'analysis'

export default function App() {
  const { sessions, refresh, remove } = useSessions()
  const pipeline = usePipeline()
  const [view, setView] = useState<View>('input')
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (ticker: string, provider: Session['provider'], model: string) => {
      setView('pipeline')
      await pipeline.run(ticker, provider, model)
    },
    [pipeline],
  )

  useEffect(() => {
    if (pipeline.result && pipeline.sessionId && !pipeline.running) {
      void (async () => {
        const session = await getSession(pipeline.sessionId!)
        setActiveSession(session)
        setActiveId(session.id)
        setView('analysis')
        await refresh()
      })()
    }
  }, [pipeline.result, pipeline.sessionId, pipeline.running, refresh])

  const handleNew = () => {
    pipeline.reset()
    setActiveSession(null)
    setActiveId(null)
    setView('input')
  }

  const handleSelect = async (id: string) => {
    const session = await getSession(id)
    setActiveSession(session)
    setActiveId(id)
    setView('analysis')
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNew={handleNew}
        onSelect={handleSelect}
        onDelete={async (id) => {
          await remove(id)
          if (activeId === id) handleNew()
        }}
      />
      <main className="relative flex flex-1 flex-col">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        {view === 'input' && <TickerInput onSubmit={handleSubmit} disabled={pipeline.running} />}
        {view === 'pipeline' && (
          <PipelineStream steps={pipeline.steps} error={pipeline.error} />
        )}
        {view === 'analysis' && activeSession && (
          <div className="grid h-full grid-cols-2 pt-12">
            <TranscriptPane analysis={activeSession.analysisResult} />
            <ChatInterface session={activeSession} />
          </div>
        )}
      </main>
    </div>
  )
}
