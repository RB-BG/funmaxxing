import type { PointerEvent as ReactPointerEvent } from "react"
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion"
import confetti from "canvas-confetti"
import { Check } from "lucide-react"
import type { EnrichedEvent } from "@/types"
import { fmtTime, gcalUrl } from "@/lib/calendar"
import { useSound } from "@/ui/sound"
import { useReducedMotion } from "@/ui/useReducedMotion"

interface EventCardProps {
  event: EnrichedEvent
  selected: boolean
  onToggle: (id: string) => void
  /** Scene facet labels shown as highlight badges (e.g. interest or country). */
  badges: string[]
}

const MAX_TILT = 9 // degrees

export function EventCard({ event, selected, onToggle, badges }: EventCardProps) {
  const { source } = event
  const { play } = useSound()
  const reduced = useReducedMotion()
  const timed = !event.start.includes("T00:00:00")

  // Pointer-reactive 3D tilt: the card leans toward the cursor and lifts.
  const rotateX = useSpring(useMotionValue(0), { stiffness: 300, damping: 22 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 300, damping: 22 })

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * MAX_TILT * 2)
    rotateX.set(-py * MAX_TILT)
  }

  function handleLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  function handleClick(e: ReactPointerEvent<HTMLDivElement>) {
    const willSelect = !selected
    play(willSelect ? "select" : "deselect")
    onToggle(event.id)
    if (willSelect && !reduced) {
      confetti({
        particleCount: 24,
        spread: 55,
        startVelocity: 24,
        scalar: 0.8,
        ticks: 90,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        colors: [source.color, "#ffd23f", "#1fe0c8"],
      })
    }
  }

  return (
    <motion.div
      data-cursor="grow"
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onMouseEnter={() => play("hover")}
      onClick={handleClick}
      style={{
        rotateX: reduced ? 0 : rotateX,
        rotateY: reduced ? 0 : rotateY,
        transformPerspective: 800,
        ...(selected ? { borderColor: source.color, background: source.color + "10" } : {}),
      }}
      whileHover={reduced ? undefined : { y: -4, scale: 1.015, boxShadow: "6px 10px 0 0 var(--ink)" }}
      whileTap={reduced ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative flex cursor-pointer select-none rounded-md border-2 border-ink bg-white"
    >
      <div className="w-1.5 shrink-0 rounded-l-[4px]" style={{ background: source.color }} />

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, rotate: -32, opacity: 0 }}
            animate={{ scale: 1, rotate: -10, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 16 }}
            className="pointer-events-none absolute right-2 top-2 z-10 border-2 border-ink bg-acid px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-ink"
          >
            gekozen!
          </motion.div>
        )}
      </AnimatePresence>

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

          <h3 className="break-words text-[15px] font-bold leading-snug text-ink">{event.title}</h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-medium text-ink/60">
            {timed && (
              <span>
                {fmtTime(event.start)} – {fmtTime(event.end)}
              </span>
            )}
            <span className="break-words">{event.location}</span>
          </div>

          {(badges.length > 0 || (event.tags?.length ?? 0) > 0) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="border-2 border-ink bg-acid px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-ink"
                >
                  {badge}
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
