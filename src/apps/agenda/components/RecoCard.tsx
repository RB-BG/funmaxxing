import type { EnrichedEvent } from "@/types"
import { cleanTitle } from "@/lib/classify"
import { cn } from "@/lib/utils"

interface RecoCardProps {
  event: EnrichedEvent
  selected: boolean
  onToggle: (id: string) => void
}

/** Compact event card for the narrow "Misschien ook leuk" sidebar column. */
export function RecoCard({ event, selected, onToggle }: RecoCardProps) {
  const { source } = event
  const date = new Date(event.start).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })

  return (
    <button
      type="button"
      data-cursor="grow"
      onClick={() => onToggle(event.id)}
      style={selected ? { borderColor: source.color, background: source.color + "12" } : undefined}
      className={cn(
        "flex w-full gap-2 rounded-md border-2 border-ink bg-white p-2 text-left transition-transform",
        "hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--ink)] active:translate-y-0 active:shadow-none",
      )}
    >
      <span className="mt-0.5 h-full w-1 shrink-0 rounded-full" style={{ background: source.color }} />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 break-words text-[13px] font-bold leading-tight text-ink">
          {cleanTitle(event.title)}
        </span>
        <span className="mt-1 block truncate text-[11px] font-semibold uppercase tracking-wide text-ink/55">
          {date} · {source.name}
        </span>
      </span>
    </button>
  )
}
