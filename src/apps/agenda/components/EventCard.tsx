import { motion } from "framer-motion"
import { Check } from "lucide-react"
import type { EnrichedEvent } from "@/types"
import { FILTER_META } from "@/lib/classify"
import { fmtTime, gcalUrl } from "@/lib/calendar"
import { useSound } from "@/ui/sound"

interface EventCardProps {
  event: EnrichedEvent
  selected: boolean
  onToggle: (id: string) => void
}

export function EventCard({ event, selected, onToggle }: EventCardProps) {
  const { source } = event
  const { play } = useSound()
  const timed = !event.start.includes("T00:00:00")

  return (
    <motion.div
      data-cursor="grow"
      onMouseEnter={() => play("hover")}
      onClick={() => {
        play(selected ? "deselect" : "select")
        onToggle(event.id)
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      style={selected ? { borderColor: source.color, background: source.color + "10" } : undefined}
      className="flex cursor-pointer select-none overflow-hidden rounded-md border-2 border-ink bg-white"
    >
      <div className="w-1.5 shrink-0" style={{ background: source.color }} />
      <div className="flex flex-1 items-start gap-3 p-3">
        <div
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border-2 border-ink"
          style={selected ? { background: source.color } : undefined}
        >
          {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px] border border-ink"
              style={{ background: source.color }}
            />
            <span className="truncate text-xs font-bold uppercase tracking-wide text-ink/55">
              {source.name}
            </span>
          </div>

          <h3 className="text-[15px] font-bold leading-snug text-ink">{event.title}</h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-medium text-ink/60">
            {timed && (
              <span>
                {fmtTime(event.start)} – {fmtTime(event.end)}
              </span>
            )}
            <span className="truncate">{event.location}</span>
          </div>

          {(event.categories.length > 0 || (event.tags?.length ?? 0) > 0) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {event.categories.map((cat) => (
                <span
                  key={cat}
                  className="border-2 border-ink bg-acid px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-ink"
                >
                  {FILTER_META[cat].label}
                </span>
              ))}
              {event.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[2px] px-1.5 py-px text-[10px] font-semibold"
                  style={{ background: source.color + "1f", color: source.color }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: source.color }}
              className="text-xs font-bold underline-offset-2 hover:underline"
            >
              Meer info
            </a>
            <a
              href={gcalUrl(event)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-bold text-grape underline-offset-2 hover:underline"
            >
              Google Agenda
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
