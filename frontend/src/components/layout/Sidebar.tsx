import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Session } from '@/types'

interface SidebarProps {
  sessions: Session[]
  activeId: string | null
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function Sidebar({ sessions, activeId, onNew, onSelect, onDelete }: SidebarProps) {
  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h1 className="text-sm font-semibold">Earnings Analyst</h1>
        <Button variant="ghost" size="sm" onClick={onNew} aria-label="New analysis">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        {sessions.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground">No sessions yet</p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`group mb-1 flex items-center gap-1 rounded-md px-2 py-2 text-sm ${
              activeId === s.id ? 'bg-muted' : 'hover:bg-muted/50'
            }`}
          >
            <button type="button" className="flex-1 text-left truncate" onClick={() => onSelect(s.id)}>
              {s.title}
            </button>
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
              onClick={() => onDelete(s.id)}
              aria-label="Delete session"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </ScrollArea>
    </aside>
  )
}
