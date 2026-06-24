import type { EnrichedEvent } from "@/types"
import { FILTER_META, utrechtGenres, UTRECHT_GENRE_META } from "@/lib/classify"
import type { AppSkin } from "@/ui/theme"

/**
 * A "scene" is a city/topic the app can switch between (Utrecht music venues,
 * buhurt across Europe, ...). Each scene defines its own skin, hero copy and how
 * its events are faceted into the sidebar filters.
 */
export interface SceneDef {
  id: string
  name: string
  titleLines: string[]
  tagline: string
  skin: AppSkin
  /** Filter facets an event belongs to within this scene. */
  facetsOf: (event: EnrichedEvent) => string[]
  /** Human label for a facet key. */
  facetLabel: (facet: string) => string
}

export const SCENES: SceneDef[] = [
  {
    id: "utrecht",
    name: "Utrecht",
    titleLines: ["LOCAL EVENTS", "UTRECHT"],
    tagline: "Kies events, download ze als .ics of voeg ze toe aan Google Agenda.",
    skin: { accent: "var(--hot)", accent2: "var(--cyan)" },
    facetsOf: (e) => utrechtGenres(e.tags ?? []),
    facetLabel: (f) => (f in UTRECHT_GENRE_META ? `${UTRECHT_GENRE_META[f as keyof typeof UTRECHT_GENRE_META].emoji} ${UTRECHT_GENRE_META[f as keyof typeof UTRECHT_GENRE_META].label}` : f),
  },
  {
    id: "games",
    name: "Spellen",
    titleLines: ["SPELLEN", "& GAMES"],
    tagline: "Magic, Warhammer, tabletop RPG en meer rond Utrecht.",
    skin: { accent: "#d97706", accent2: "#6366f1" },
    facetsOf: (e) => [e.source.name],
    facetLabel: (f) => f,
  },
  {
    id: "beurzen",
    name: "Beurzen",
    titleLines: ["BEURZEN", "& CONS"],
    tagline: "Comic con, anime-cons en spellenmarkten in Nederland.",
    skin: { accent: "#2563eb", accent2: "#db2777" },
    facetsOf: (e) => [e.source.name],
    facetLabel: (f) => f,
  },
  {
    id: "buhurt",
    name: "Buhurt EU",
    titleLines: ["BUHURT", "EUROPE"],
    tagline: "Geharnaste toernooien en fight nights door heel Europa.",
    skin: { accent: "#b61e1e", accent2: "#e0a82e" },
    facetsOf: (e) => (e.country ? [e.country] : []),
    facetLabel: (f) => f,
  },
  {
    id: "middeleeuwen",
    name: "Middeleeuwen",
    titleLines: ["FANTASY", "& RIDDERS"],
    tagline: "Fantasy fairs, riddertoernooien en middeleeuwse festivals in Nederland.",
    skin: { accent: "#92400e", accent2: "#166534" },
    facetsOf: (e) => [e.source.name],
    facetLabel: (f) => f,
  },
]

export function sceneById(id: string): SceneDef {
  return SCENES.find((s) => s.id === id) ?? SCENES[0]
}
