import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STYLES: Record<string, string> = {
  positive: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  negative: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  tone: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

export function Annotation({
  label,
  variant,
}: {
  label: string
  variant: keyof typeof STYLES
}) {
  return <Badge className={cn('mx-0.5 align-middle', STYLES[variant] ?? STYLES.tone)}>{label}</Badge>
}
