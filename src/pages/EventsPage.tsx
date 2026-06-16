import { useMemo, useState } from "react"
import type { EnrichedEvent } from "@/types"
import { SOURCES } from "@/data/sources"
import { classify } from "@/lib/classify"
import { downloadICS } from "@/lib/calendar"
import { FilterBar, type Filter } from "@/components/FilterBar"
import { EventCard } from "@/components/EventCard"
import { ActionBar } from "@/components/ActionBar"

/** Flatten + enrich every source event with its source and derived categories. */
function buildEvents(): EnrichedEvent[] {
  return SOURCES.flatMap((source) =>
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

export function EventsPage() {
  const allEvents = useMemo(() => buildEvents(), [])
  const [activeFilter, setActiveFilter] = useState<Filter>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const visible = useMemo(
    () =>
      allEvents
        .filter((e) => matchesFilter(e, activeFilter))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [allEvents, activeFilter],
  )

  // Group the visible events by calendar day (YYYY-MM-DD), preserving sort order.
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

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(visible.map((e) => e.id)))
  }

  function clearAll() {
    setSelected(new Set())
  }

  function handleDownload() {
    downloadICS(allEvents.filter((e) => selected.has(e.id)))
  }

  return (
    <div className="mx-auto min-h-screen max-w-[620px] px-4 pb-28 pt-5 text-neutral-900">
      <header className="mb-5">
        <h1 className="text-xl font-bold tracking-tight">🎲 Local Events Utrecht</h1>
        <p className="mt-1 text-[13px] text-neutral-400">
          Selecteer evenementen en download ze als .ics of voeg ze direct toe aan Google Agenda
        </p>
      </header>

      <FilterBar active={activeFilter} onChange={handleFilter} />

      {days.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-neutral-400">
          Geen evenementen gevonden voor dit filter.
        </div>
      ) : (
        days.map(([day, events]) => {
          const dayDate = new Date(day + "T12:00:00")
          const label = dayDate.toLocaleDateString("nl-NL", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
          return (
            <section key={day} className="mb-5">
              <div className="mb-2 mt-1.5 flex items-center gap-1.5 border-b border-neutral-100 pb-2 text-[13px] font-bold text-neutral-700">
                <span className="capitalize">{label}</span>
                {day === todayStr && (
                  <span className="rounded-full bg-neutral-900 px-1.5 py-px text-[10px] font-semibold tracking-wide text-white">
                    Vandaag
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    selected={selected.has(event.id)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            </section>
          )
        })
      )}

      <div className="mt-6 rounded-[10px] border border-dashed border-neutral-200 bg-white px-3.5 py-3 text-xs leading-relaxed text-neutral-400">
        <strong className="text-neutral-500">➕ Meer evenementen?</strong>
        <p className="mt-1">
          Voeg nieuwe evenementen toe in <code className="rounded bg-neutral-100 px-1.5 py-px text-[11px] text-neutral-700">src/data/sources.ts</code>.
          De dagelijkse Cowork-taak houdt dit bestand automatisch up-to-date.
        </p>
      </div>

      <ActionBar
        count={selected.size}
        onSelectAll={selectAll}
        onClear={clearAll}
        onDownload={handleDownload}
      />
    </div>
  )
}
