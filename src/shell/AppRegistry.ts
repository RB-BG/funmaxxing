import { lazy, type ComponentType, type LazyExoticComponent } from "react"

/**
 * An "app" in the funmaxxing universe. Today there is one (the agenda); later a
 * desktop shell can render this registry as icons/windows without rewrites.
 */
export interface AppDef {
  id: string
  name: string
  icon: string
  /** Lazy-loaded entry component (default export of the app module). */
  Component: LazyExoticComponent<ComponentType>
}

export const APPS: AppDef[] = [
  {
    id: "agenda",
    name: "Local Events Utrecht",
    icon: "🎲",
    Component: lazy(() => import("@/apps/agenda/AgendaApp")),
  },
]
