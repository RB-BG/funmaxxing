import type { Category, EventItem } from "@/types"

/** Display metadata per interest category. */
export const FILTER_META: Record<Category, { label: string; emoji: string }> = {
  GAME: { label: "Game concert", emoji: "🎮" },
  DNB: { label: "Drum & Bass", emoji: "🥁" },
  NOS: { label: "Zeroes & Heroes", emoji: "🕹️" },
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
