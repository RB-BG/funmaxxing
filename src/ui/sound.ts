import { createContext, useContext } from "react"

/** Named sound effects, synthesized with the Web Audio API (no audio assets). */
export type Sfx = "hover" | "click" | "select" | "deselect" | "add" | "whoosh"

export interface SoundContextValue {
  muted: boolean
  toggle: () => void
  play: (sfx: Sfx) => void
}

export const SoundContext = createContext<SoundContextValue | null>(null)

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext)
  if (!ctx) throw new Error("useSound must be used within a SoundProvider")
  return ctx
}
