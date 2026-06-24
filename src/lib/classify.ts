import type { Category, EventItem } from "@/types"

/** Display metadata per interest category. */
export const FILTER_META: Record<Category, { label: string; emoji: string }> = {
  GAME: { label: "Game concert", emoji: "🎮" },
  DNB: { label: "Drum & Bass", emoji: "🥁" },
  NOS: { label: "Zeroes & Heroes", emoji: "🕹️" },
}

// ---------------------------------------------------------------------------
// Utrecht genre buckets
// ---------------------------------------------------------------------------

export type UtrechtGenre =
  | "ELECTRONIC" | "ROCK" | "REGGAE" | "HIPHOP" | "DNB" | "JAZZ" | "POP"
  | "WORKSHOP" | "GRATIS" | "FESTIVAL"

export const UTRECHT_GENRE_META: Record<UtrechtGenre, { label: string; emoji: string }> = {
  ELECTRONIC: { label: "Electronic / Dance", emoji: "🎛️" },
  ROCK:       { label: "Rock / Punk / Metal", emoji: "🎸" },
  REGGAE:     { label: "Reggae / Ska / Dub", emoji: "🌿" },
  HIPHOP:     { label: "Hiphop / Rap", emoji: "🎤" },
  DNB:        { label: "Drum & Bass", emoji: "🥁" },
  JAZZ:       { label: "Jazz / Soul / Funk", emoji: "🎷" },
  POP:        { label: "Pop / Indie", emoji: "✨" },
  WORKSHOP:   { label: "Workshop", emoji: "🛠️" },
  GRATIS:     { label: "Gratis", emoji: "🆓" },
  FESTIVAL:   { label: "Festival & Outdoor", emoji: "🎪" },
}

const UTRECHT_GENRE_TAGS: Record<UtrechtGenre, string[]> = {
  ELECTRONIC: [
    "house", "techno", "trance", "bounce", "hard house", "hardtechno",
    "groovy techno", "acid techno", "underground techno", "hardgroove",
    "hypnotic techno", "old school techno", "speed house", "industrial",
    "dansavond", "dj's in cafe", "electronics",
  ],
  ROCK: [
    "rock", "punk", "garage", "metal", "hardcore", "post hardcore",
    "progressive metal", "death metal", "deathcore", "blues", "psychedelic",
    "rock 'n roll", "new wave", "queercore",
  ],
  REGGAE: ["reggae", "ska", "dub", "rocksteady"],
  HIPHOP: ["hip-hop", "hiphop", "rap", "grime"],
  DNB:    ["drum and bass", "drum & bass", "dnb", "jungle", "neurofunk"],
  JAZZ:   ["jazz", "soul", "funk", "swing"],
  POP:    ["pop", "indie", "singer-songwriter", "singer songwriter"],
  WORKSHOP: ["workshop"],
  GRATIS: ["gratis"],
  FESTIVAL: [],
}

/** Whole-word, case-insensitive matcher (so "house" doesn't match "warehouse"). */
function keywordRegex(kw: string): RegExp {
  return new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
}

/**
 * Return Utrecht genre buckets for an event. Matches on the venue's own tags
 * (precise) and, in the same pass, on the title + description so tagless venues
 * like EKKO/De Helling/TivoliVredenburg still land in a filter.
 */
export function utrechtGenres(event: { title: string; description?: string; tags?: string[] }): UtrechtGenre[] {
  const tags = (event.tags ?? []).map((t) => t.toLowerCase())
  const text = `${event.title} ${event.description ?? ""}`
  return (Object.keys(UTRECHT_GENRE_TAGS) as UtrechtGenre[]).filter((genre) =>
    UTRECHT_GENRE_TAGS[genre].some(
      (kw) => tags.some((t) => t.includes(kw)) || keywordRegex(kw).test(text),
    ),
  )
}

const SOLD_OUT_RE = /\b(sold\s*out|uitverkocht)\b/i

/** True when the event title or description marks it as sold out. */
export function isSoldOut(event: { title: string; description?: string }): boolean {
  return SOLD_OUT_RE.test(event.title) || SOLD_OUT_RE.test(event.description ?? "")
}

/** Strip sold-out markers (e.g. "* Sold out*", "SOLD OUT!") from a title for display. */
export function cleanTitle(title: string): string {
  return title
    .replace(/\*+\s*sold\s*out\s*\*+/gi, "")
    .replace(/\(?\s*\b(sold\s*out|uitverkocht)\b\s*!*\)?/gi, "")
    .replace(/^[\s*!:_-]+|[\s*!:_-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

/** Keywords used for automatic classification (replaces the AI step in the Cowork artifact). */
const KEYWORDS: Record<Category, string[]> = {
  GAME: [
    "game concert", "game music", "gaming", "chiptune", "8-bit", "16-bit",
    "nintendo", "zelda", "mario", "sonic", "final fantasy", "video game",
    "pixel art", "arcade", "game soundtrack", "orchestral game",
  ],
  DNB: [
    "drum and bass", "drum & bass", "dnb", "d&b", "jungle", "neurofunk",
    "liquid funk", "liquid dnb", "amen break",
  ],
  NOS: [
    "zeroes", "zeros", "heroes", "noughties", "2000s", "2010s", "00s", "10s",
    "nostalgi", "throwback", "terug in de tijd", "retro night", "back to the",
    "old school", "2000-2020", "hits van vroeger",
  ],
}

/** Classify a single event into zero or more interest categories by keyword match. */
export function classify(event: EventItem): Category[] {
  const haystack = [event.title, event.description ?? "", ...(event.tags ?? [])]
    .join(" ")
    .toLowerCase()

  return (Object.keys(KEYWORDS) as Category[]).filter((cat) =>
    KEYWORDS[cat].some((kw) => haystack.includes(kw)),
  )
}
