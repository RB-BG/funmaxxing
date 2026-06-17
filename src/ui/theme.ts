import type { CSSProperties } from "react"

/** A per-app accent skin. Drives the --app-accent CSS variables (Lowlands pattern). */
export interface AppSkin {
  accent: string
  accent2: string
}

/** Registry of app skins. Each "app" gets its own accent pair. */
export const SKINS: Record<string, AppSkin> = {
  agenda: { accent: "var(--hot)", accent2: "var(--cyan)" },
}

/** Returns inline style that overrides the --app-accent variables for a subtree. */
export function skinVars(skin: AppSkin): CSSProperties {
  return {
    ["--app-accent" as string]: skin.accent,
    ["--app-accent-2" as string]: skin.accent2,
  } as CSSProperties
}
