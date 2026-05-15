export function ProviderBadge({ provider, model }: { provider?: string; model?: string }) {
  if (!provider) return null
  return (
    <span className="text-[10px] text-muted-foreground">
      {provider} · {model ?? 'default'}
    </span>
  )
}
