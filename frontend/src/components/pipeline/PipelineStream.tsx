import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StepIndicator } from './StepIndicator'
import type { PipelineStep } from '@/types'

export function PipelineStream({ steps, error }: { steps: PipelineStep[]; error: string | null }) {
  return (
    <Card className="max-w-lg mx-auto mt-12">
      <CardHeader>
        <CardTitle>Analysing earnings call</CardTitle>
      </CardHeader>
      <CardContent>
        {steps.map((step) => (
          <StepIndicator key={step.id} step={step} />
        ))}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  )
}
