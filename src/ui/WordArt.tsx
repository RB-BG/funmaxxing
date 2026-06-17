import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

interface WordArtProps {
  text: string
  className?: string
  /** Adds a slow holographic gradient shimmer (disabled under reduced motion). */
  animated?: boolean
  style?: CSSProperties
}

/** 00s-style WordArt: gradient fill, ink outline and a hard drop shadow. */
export function WordArt({ text, className, animated, style }: WordArtProps) {
  return (
    <span
      className={cn("inline-block font-display leading-none", animated && "wordart-shimmer", className)}
      style={{
        backgroundImage:
          "linear-gradient(100deg, var(--acid), var(--hot) 30%, var(--grape) 55%, var(--cyan) 75%, var(--acid))",
        backgroundSize: animated ? "220% auto" : "100% auto",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextStroke: "2px var(--ink)",
        paintOrder: "stroke fill",
        filter: "drop-shadow(3px 3px 0 var(--ink))",
        ...style,
      }}
    >
      {text}
    </span>
  )
}
