import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'
import type { PipelineStep } from '@/types'

export function StepIndicator({ step }: { step: PipelineStep }) {
  const icon =
    step.status === 'running' ? (
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
    ) : step.status === 'done' ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : step.status === 'error' ? (
      <XCircle className="h-4 w-4 text-red-500" />
    ) : (
      <Circle className="h-4 w-4 text-muted-foreground" />
    )

  return (
    <div className="flex items-start gap-3 py-2">
      {icon}
      <div>
        <p className="text-sm font-medium">{step.label}</p>
        {step.detail && <p className="text-xs text-muted-foreground">{step.detail}</p>}
      </div>
    </div>
  )
}
