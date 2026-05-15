import { ScrollArea } from '@/components/ui/scroll-area'
import { Annotation } from './Annotation'
import { findCharOffset } from '@/lib/utils'
import type { AnalysisResult } from '@/types'

export function TranscriptPane({ analysis }: { analysis: AnalysisResult }) {
  const text = `${analysis.rawTranscript.preparedRemarks}\n\n${analysis.rawTranscript.questionsAndAnswers}`

  return (
    <ScrollArea className="h-full border-r border-border p-4">
      <h2 className="mb-2 text-sm font-semibold">{analysis.ticker} — {analysis.quarter}</h2>
      <div className="mb-4 flex flex-wrap gap-1">
        {analysis.extraction.guidanceStatements.slice(0, 5).map((g, i) => (
          <Annotation
            key={i}
            label={g.sentiment === 'positive' ? '↑ GUIDANCE' : '↓ GUIDANCE'}
            variant={g.sentiment === 'positive' ? 'positive' : 'negative'}
          />
        ))}
        {analysis.redFlags.map((f, i) => (
          <Annotation
            key={`rf-${i}`}
            label={f.severity === 'high' ? '⚠ HIGH' : '⚠ MEDIUM'}
            variant={f.severity}
          />
        ))}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{text}</p>
      <p className="mt-4 text-xs text-muted-foreground">
        Offsets use fuzzy match on evidence:{' '}
        {findCharOffset(text, analysis.redFlags[0]?.evidence ?? '')}
      </p>
    </ScrollArea>
  )
}
