import { useMediaQuery } from "./useMediaQuery"

/** Tracks the user's prefers-reduced-motion setting (live). */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)")
}
