import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import type { EnrichedEvent, Source } from "@/types"
import { classify } from "@/lib/classify"
import { downloadICS } from "@/lib/calendar"
import { WordArt } from "@/ui/WordArt"
import { MarqueeBar } from "@/ui/MarqueeBar"
import { RetroButton } from "@/ui/Retro"
import { useSound } from "@/ui/sound"
import { useReducedMotion } from "@/ui/useReducedMotion"
import { skinVars, SKINS } from "@/ui/theme"
import { Sidebar, type Filter } from "./components/Sidebar"
import { EventCard } from "./components/EventCard"

function buildEvents(sources: Source[]): EnrichedEvent[] {
  return sources.flatMap((source) =>
    source.events.map((event) => ({
      ...event,
      source,
      categories: classify(event),
    })),
  )
}

function matchesFilter(event: EnrichedEvent, filter: Filter): boolean {
  return filter === "all" || event.categories.includes(filter)
}

export function AgendaApp() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeFilter, setActiveFilter] = useState<Filter>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { muted, toggle, play } = useSound()
  const reduced = useReducedMotion()

  useEffect(() => {
    fetch("/events.json")
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
      .then((data: { sources: Source[] }) => setSources(data.sources))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const allEvents = useMemo(() => buildEvents(sources), [sources])

  const counts = useMemo<Record<Filter, number>>(() => {
    const c: Record<Filter, number> = { all: allEvents.length, GAME: 0, DNB: 0, NOS: 0 }
    for (const e of allEvents) for (const cat of e.categories) c[cat]++
    return c
  }, [allEvents])

  const visible = useMemo(
    () =>
      allEvents
        .filter((e) => matchesFilter(e, activeFilter))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [allEvents, activeFilter],
  )

  const ticker = useMemo(() => visible.slice(0, 16).map((e) => e.title), [visible])

  const days = useMemo(() => {
    const groups = new Map<string, EnrichedEvent[]>()
    for (const event of visible) {
      const day = event.start.slice(0, 10)
      const bucket = groups.get(day)
      if (bucket) bucket.push(event)
      else groups.set(day, [event])
    }
    return [...groups.entries()]
  }, [visible])

  const todayStr = new Date().toISOString().slice(0, 10)

  function handleFilter(filter: Filter) {
    setActiveFilter(filter)
    setSelected(new Set())
  }

  function toggleEvent(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearAll() {
    play("whoosh")
    setSelected(new Set())
  }

  function heroBoom(e: ReactMouseEvent) {
    play("add")
    if (!reduced) {
      confetti({
        particleCount: 90,
        spread: 110,
        startVelocity: 38,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        colors: ["#ff2e93", "#1fe0c8", "#ffd23f", "#6320ee"],
      })
    }
  }

  function handleDownload() {
    const picked = allEvents.filter((e) => selected.has(e.id))
    if (picked.length === 0) return
    play("add")
    if (!reduced) {
      confetti({
        particleCount: 130,
        spread: 75,
        origin: { y: 0.85 },
        colors: ["#ff2e93", "#1fe0c8", "#ffd23f", "#6320ee"],
      })
    }
    downloadICS(picked)
  }

  return (
    <div style={skinVars(SKINS.agenda)} className="mx-auto min-h-screen max-w-[980px] px-4 pb-24 pt-5">
      <header className="mb-4 flex items-start justify-between gap-4 rounded-md border-2 border-ink bg-white p-5">
        <motion.div
          data-cursor="grow"
          onClick={heroBoom}
          onMouseEnter={() => play("hover")}
          whileTap={reduced ? undefined : { scale: 0.97, rotate: -1.2 }}
          title="klik me"
          className="min-w-0 cursor-pointer"
        >
          <WordArt animated text="LOCAL EVENTS" className="block text-3xl sm:text-5xl" />
          <WordArt animated text="UTRECHT" className="block text-3xl sm:text-5xl" />
          <p className="mt-3 max-w-md text-sm font-medium text-ink/70">
            Kies events, download ze als .ics of voeg ze toe aan Google Agenda.
          </p>
        </motion.div>
        <button
          type="button"
          onClick={toggle}
          onMouseEnter={() => play("hover")}
          aria-label={muted ? "Geluid aan" : "Geluid uit"}
          title={muted ? "Geluid aan" : "Geluid uit"}
          className="shrink-0 rounded-md border-2 border-ink bg-white px-2.5 py-2 text-lg leading-none shadow-[2px_2px_0_0_var(--ink)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </header>

      <div className="mb-5">
        <MarqueeBar items={ticker.length ? ticker : ["wat is er los in de stad"]} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          {loading ? (
            <div className="rounded-md border-2 border-ink bg-white p-10 text-center text-sm font-semibold text-ink/60">
              Events laden…
            </div>
          ) : error ? (
            <div className="rounded-md border-2 border-ink bg-white p-10 text-center text-sm font-semibold text-hot">
              Kon events niet laden. Ververs de pagina.
            </div>
          ) : days.length === 0 ? (
            <div className="rounded-md border-2 border-ink bg-white p-10 text-center text-sm font-semibold text-ink/60">
              Geen events voor dit filter.
            </div>
          ) : (
            <div key={activeFilter} className="flex flex-col gap-6">
              {days.map(([day, events]) => {
                const dayDate = new Date(day + "T12:00:00")
                const label = dayDate.toLocaleDateString("nl-NL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
                return (
                  <section key={day}>
                    <div className="mb-2 flex items-center gap-3">
                      <h2 className="text-lg font-bold uppercase tracking-wide text-ink">{label}</h2>
                      {day === todayStr && (
                        <span
                          className="border-2 border-ink px-1.5 py-px text-[10px] font-bold uppercase text-ink"
                          style={{ background: "var(--app-accent)" }}
                        >
                          Vandaag
                        </span>
                      )}
                      <div className="h-0.5 flex-1 bg-ink/15" />
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {events.map((event, i) => (
                        <motion.div
                          key={event.id}
                          initial={reduced ? false : { opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i, 10) * 0.035, type: "spring", stiffness: 320, damping: 26 }}
                        >
                          <EventCard
                            event={event}
                            selected={selected.has(event.id)}
                            onToggle={toggleEvent}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </main>

        <aside className="order-first lg:order-none lg:sticky lg:top-4 lg:self-start">
          <Sidebar
            active={activeFilter}
            counts={counts}
            onFilter={handleFilter}
            selectedCount={selected.size}
            onClear={clearAll}
            onDownload={handleDownload}
            sources={sources}
          />
        </aside>
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-3 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-md border-2 border-ink bg-cream px-3 py-2 shadow-[3px_3px_0_0_var(--ink)] lg:hidden">
          <span className="text-xs font-bold uppercase text-ink">{selected.size} gekozen</span>
          <RetroButton type="button" onClick={handleDownload} style={{ background: "var(--app-accent)" }}>
            Download .ics
          </RetroButton>
        </div>
      )}
    </div>
  )
}

export default AgendaApp
