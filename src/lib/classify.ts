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

export type UtrechtGenre = "ELECTRONIC" | "ROCK" | "REGGAE" | "WORKSHOP" | "GRATIS"

export const UTRECHT_GENRE_META: Record<UtrechtGenre, { label: string; emoji: string }> = {
  ELECTRONIC: { label: "Electronic / Dance", emoji: "🎛️" },
  ROCK:       { label: "Rock / Punk / Metal", emoji: "🎸" },
  REGGAE:     { label: "Reggae / Ska / Dub", emoji: "🌿" },
  WORKSHOP:   { label: "Workshop", emoji: "🛠️" },
  GRATIS:     { label: "Gratis", emoji: "🆓" },
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
    "rock 'n roll", "new wave", "wave", "queercore", "angry",
  ],
  REGGAE: ["reggae", "ska", "dub", "rocksteady"],
  WORKSHOP: ["workshop"],
  GRATIS: ["gratis"],
}

/** Return Utrecht genre buckets for an event based on its tags. */
export function utrechtGenres(tags: string[]): UtrechtGenre[] {
  const normalised = tags.map((t) => t.toLowerCase())
  return (Object.keys(UTRECHT_GENRE_TAGS) as UtrechtGenre[]).filter((genre) =>
    UTRECHT_GENRE_TAGS[genre].some((kw) => normalised.some((t) => t.includes(kw))),
  )
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
