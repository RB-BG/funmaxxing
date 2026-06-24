import type { Source } from "@/types"
import { cn } from "@/lib/utils"
import { Panel, RetroButton } from "@/ui/Retro"
import { useSound } from "@/ui/sound"

export interface FilterOption {
  key: string
  label: string
  count: number
}

const WEEKEND_LABELS = [
  "rustig thuisblijven",
  "eentje is geentje",
  "gezellig",
  "druk weekendje",
  "back to back",
  "geen slaap meer",
  "uitgaansmonster",
]

function weekendLabel(n: number): string {
  return WEEKEND_LABELS[Math.min(n, WEEKEND_LABELS.length - 1)]
}

interface SidebarProps {
  filters: FilterOption[]
  active: string
  onFilter: (key: string) => void
  selectedCount: number
  onClear: () => void
  onDownload: () => void
  sources: Source[]
  hiddenSources: Set<string>
  onToggleSource: (id: string) => void
}

export function Sidebar({
  filters,
  active,
  onFilter,
  selectedCount,
  onClear,
  onDownload,
  sources,
  hiddenSources,
  onToggleSource,
}: SidebarProps) {
  const { play } = useSound()
  const venues = sources.filter((s) => s.events.length > 0)

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Filters" collapsible defaultOpen={false}>
        <nav className="flex flex-col">
          {filters.map(({ key, label, count }) => {
            const on = active === key
            return (
              <button
                key={key}
                type="button"
                onMouseEnter={() => play("hover")}
                onClick={() => {
                  play("click")
                  onFilter(key)
                }}
                style={on ? { background: "var(--app-accent)" } : undefined}
                className={cn(
                  "flex items-center justify-between gap-2 border-b-2 border-ink/10 px-3 py-2 text-left text-sm font-semibold transition-colors last:border-b-0",
                  on ? "text-ink" : "text-ink/70 hover:bg-ink/5",
                )}
              >
                <span className="truncate">{label}</span>
                <span className="font-display text-base leading-none">{count}</span>
              </button>
            )
          })}
        </nav>
      </Panel>

      <Panel title="Selectie">
        <div className="p-3">
          <p className="mb-2 text-sm font-semibold text-ink/80">
            {selectedCount > 0
              ? `${selectedCount} event${selectedCount === 1 ? "" : "s"} gekozen`
              : "Nog niks gekozen"}
          </p>
          <div className="flex gap-2">
            <RetroButton
              type="button"
              disabled={selectedCount === 0}
              onMouseEnter={() => play("hover")}
              onClick={onDownload}
              style={selectedCount > 0 ? { background: "var(--app-accent)" } : undefined}
              className="flex-1"
            >
              Download .ics
            </RetroButton>
            <RetroButton
              type="button"
              disabled={selectedCount === 0}
              onMouseEnter={() => play("hover")}
              onClick={onClear}
            >
              Wis
            </RetroButton>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-ink/55">
              <span>weekend-meter</span>
              <span className="text-ink/80">{weekendLabel(selectedCount)}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-white">
              <div
                className="h-full transition-[width] duration-300 ease-out"
                style={{ width: `${(Math.min(selectedCount, 8) / 8) * 100}%`, background: "var(--app-accent)" }}
              />
            </div>
          </div>
        </div>
      </Panel>

      {venues.length > 0 && (
        <Panel title="Bronnen" collapsible defaultOpen={false}>
          <ul className="flex flex-col">
            {venues.map((s) => {
              const hidden = hiddenSources.has(s.id)
              return (
                <li key={s.id} className="border-b-2 border-ink/10 last:border-b-0">
                  <button
                    type="button"
                    onMouseEnter={() => play("hover")}
                    onClick={() => onToggleSource(s.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-ink/5",
                      hidden && "opacity-40",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-[2px] border border-ink transition-colors"
                        style={hidden ? undefined : { background: s.color }}
                      />
                      <span className={cn("truncate font-medium text-ink/80", hidden && "line-through")}>
                        {s.name}
                      </span>
                      {s.broken && (
                        <span className="shrink-0 border border-ink bg-acid px-1 py-px text-[9px] font-bold uppercase leading-none tracking-wide text-ink">
                          kapot
                        </span>
                      )}
                    </span>
                    <span className="font-display text-base leading-none text-ink/50">{s.events.length}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}
    </div>
  )
}
