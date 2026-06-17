import MarqueeImport from "react-fast-marquee"
import { useReducedMotion } from "./useReducedMotion"

// react-fast-marquee ships as CJS; Vite's interop can wrap the forwardRef
// component in a { default } namespace, so unwrap it defensively.
const FastMarquee = (MarqueeImport as unknown as { default?: typeof MarqueeImport }).default ?? MarqueeImport

interface MarqueeBarProps {
  items: string[]
  speed?: number
}

/** A slim, readable ticker (no emoji). Static under reduced motion. */
export function MarqueeBar({ items, speed = 50 }: MarqueeBarProps) {
  const reduced = useReducedMotion()
  if (items.length === 0) return null
  const line = items.join("     •     ")

  return (
    <div
      className="rounded-md border-2 border-ink px-1 py-1.5 text-xs font-bold uppercase tracking-wide text-ink"
      style={{ background: "var(--app-accent-2)" }}
    >
      {reduced ? (
        <div className="truncate px-2">{line}</div>
      ) : (
        <FastMarquee speed={speed} gradient={false} pauseOnHover>
          <span className="mx-8">{line}</span>
          <span className="mx-8">{line}</span>
        </FastMarquee>
      )}
    </div>
  )
}
