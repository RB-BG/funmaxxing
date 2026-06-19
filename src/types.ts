/** Interest categories an event can be classified into. */
export type Category = "GAME" | "DNB" | "NOS"

/** A single event as defined in the data sources. */
export interface EventItem {
  id: string
  title: string
  /** ISO datetime string with timezone offset. */
  start: string
  /** ISO datetime string with timezone offset. */
  end: string
  location: string
  description?: string
  url: string
  tags?: string[]
  /** Country (used by non-Utrecht scenes like buhurt for filtering). */
  country?: string
}

/** A venue / feed and its events. */
export interface Source {
  id: string
  name: string
  color: string
  icon: string
  feedUrl: string
  /** The scene (city/topic) this source belongs to, e.g. "utrecht" | "buhurt". */
  scene?: string
  events: EventItem[]
  /** True when the last scrape returned suspiciously few events or threw an error. */
  broken?: boolean
}

/** An event enriched at runtime with its source and derived categories. */
export interface EnrichedEvent extends EventItem {
  source: Source
  categories: Category[]
}
