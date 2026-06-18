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
}

export function Sidebar({
  filters,
  active,
  onFilter,
  selectedCount,
  onClear,
  onDownload,
  sources,
}: SidebarProps) {
  const { play } = useSound()
  const venues = sources.filter((s) => s.events.length > 0)

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Filters">
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
        <Panel title="Bronnen">
          <ul className="flex flex-col">
            {venues.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 border-b-2 border-ink/10 px-3 py-1.5 text-sm last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-[2px] border border-ink"
                    style={{ background: s.color }}
                  />
                  <span className="truncate font-medium text-ink/80">{s.name}</span>
                </span>
                <span className="font-display text-base leading-none text-ink/50">{s.events.length}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}
