/**
 * Lightweight, client-side content-based recommender.
 *
 * It has no model and no history: it reads the events the user just picked,
 * builds a weighted "taste profile" from their features (genres, venue, ...),
 * and ranks the remaining events by how well they match. Features come from
 * whatever the active scene exposes via facetsOf, plus a lighter venue signal.
 */

const VENUE_WEIGHT = 0.5

export interface Recommendable {
  id: string
  start: string
  source: { id: string }
}

/**
 * Rank `candidates` by similarity to the user's selection.
 *
 * @param selectedIds  ids of the events the user has picked
 * @param candidates   the pool to recommend from (whole scene, non-hidden)
 * @param featuresOf   extracts the feature tokens for an event (e.g. genres)
 * @param limit        max number of recommendations to return
 */
export function recommend<T extends Recommendable>(
  selectedIds: Set<string>,
  candidates: T[],
  featuresOf: (event: T) => string[],
  limit = 6,
): T[] {
  if (selectedIds.size === 0) return []

  const picked = candidates.filter((e) => selectedIds.has(e.id))
  if (picked.length === 0) return []

  // Build the taste profile: how strongly the user leans toward each feature.
  const profile = new Map<string, number>()
  const add = (key: string, weight: number) => profile.set(key, (profile.get(key) ?? 0) + weight)
  for (const event of picked) {
    for (const f of featuresOf(event)) add(`f:${f}`, 1)
    add(`src:${event.source.id}`, VENUE_WEIGHT)
  }

  const scored = candidates
    .filter((e) => !selectedIds.has(e.id))
    .map((event) => {
      let score = profile.get(`src:${event.source.id}`) ?? 0
      for (const f of featuresOf(event)) score += profile.get(`f:${f}`) ?? 0
      return { event, score }
    })
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(a.event.start).getTime() - new Date(b.event.start).getTime(),
    )

  return scored.slice(0, limit).map((s) => s.event)
}
