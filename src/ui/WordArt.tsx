import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

interface WordArtProps {
  text: string
  className?: string
  style?: CSSProperties
}

/** 00s-style WordArt: gradient fill, ink outline and a hard drop shadow. */
export function WordArt({ text, className, style }: WordArtProps) {
  return (
    <span
      className={cn("inline-block font-display leading-none", className)}
      style={{
        backgroundImage: "linear-gradient(180deg, var(--acid), var(--hot) 55%, var(--grape))",
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
