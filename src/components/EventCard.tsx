import { Check } from "lucide-react"
import type { EnrichedEvent } from "@/types"
import { FILTER_META } from "@/lib/classify"
import { fmtTime, gcalUrl } from "@/lib/calendar"
import { cn } from "@/lib/utils"

interface EventCardProps {
  event: EnrichedEvent
  selected: boolean
  onToggle: (id: string) => void
}

export function EventCard({ event, selected, onToggle }: EventCardProps) {
  const { source } = event

  return (
    <div
      onClick={() => onToggle(event.id)}
      style={selected ? { borderColor: source.color, background: source.color + "08" } : undefined}
      className={cn(
        "relative cursor-pointer select-none rounded-[10px] border-[1.5px] border-neutral-200 bg-white px-3.5 py-3 transition-colors",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          style={selected ? { background: source.color, borderColor: source.color } : undefined}
          className="mt-0.5 flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded border-2 border-neutral-300 bg-white"
        >
          {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
        </div>

        <div className="min-w-0 flex-1">
          <span
            style={{ background: source.color + "18", color: source.color }}
            className="mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          >
            {source.icon} {source.name}
          </span>

          <div className="mb-0.5 text-sm font-semibold leading-tight">{event.title}</div>
          <div className="text-xs text-neutral-500">🕐 {fmtTime(event.start)} – {fmtTime(event.end)}</div>
          <div className="text-xs text-neutral-500">📍 {event.location}</div>

          {event.tags && event.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  style={{ background: source.color + "15", color: source.color }}
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {event.categories.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {event.categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-700"
                >
                  {FILTER_META[cat].emoji} {FILTER_META[cat].label}
                </span>
              ))}
            </div>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: source.color }}
              onClick={(e) => e.stopPropagation()}
              className="inline-block text-[11px] font-medium"
            >
              ↗ Meer info
            </a>
            <a
              href={gcalUrl(event)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-block text-[11px] font-medium text-[#1a73e8] hover:underline"
            >
              📅 Google Agenda
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
