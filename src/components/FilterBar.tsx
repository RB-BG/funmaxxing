import type { Category } from "@/types"
import { cn } from "@/lib/utils"

export type Filter = "all" | Category

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Alles" },
  { key: "GAME", label: "🎮 Game concerten" },
  { key: "DNB", label: "🥁 Drum & Bass" },
  { key: "NOS", label: "🕹️ Zeroes & Heroes" },
]

const ACTIVE_COLORS: Record<Filter, string> = {
  all: "#111827",
  GAME: "#7c3aed",
  DNB: "#b45309",
  NOS: "#0369a1",
}

interface FilterBarProps {
  active: Filter
  onChange: (filter: Filter) => void
}

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {FILTERS.map(({ key, label }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={isActive ? { background: ACTIVE_COLORS[key], borderColor: ACTIVE_COLORS[key] } : undefined}
            className={cn(
              "cursor-pointer whitespace-nowrap rounded-full border-[1.5px] px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "text-white"
                : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-700",
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
