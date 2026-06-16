import type { Source } from "@/types"

/**
 * VENUES — definitie van podia en feeds.
 * Events worden opgehaald via de scraper (scripts/scrape.ts) en opgeslagen in public/events.json.
 * Run `npm run scrape` om de data handmatig te verversen.
 */
export const SOURCES: Omit<Source, "events">[] = [
  {
    id: "dbs-utrecht",
    name: "dB's Utrecht",
    color: "#ef4444",
    icon: "🎸",
    feedUrl: "https://www.podiuminfo.nl/podium/5465/concerten/dBs/Utrecht/",
  },
  {
    id: "ekko-utrecht",
    name: "EKKO Utrecht",
    color: "#0ea5e9",
    icon: "🔵",
    feedUrl: "https://www.podiuminfo.nl/podium/60/concerten/EKKO/Utrecht/",
  },
  {
    id: "de-helling",
    name: "De Helling",
    color: "#22c55e",
    icon: "🟢",
    feedUrl: "https://www.podiuminfo.nl/podium/3/concerten/De-Helling/Utrecht/",
  },
  {
    id: "nar-utrecht",
    name: "NAR Café der Kunsten",
    color: "#a855f7",
    icon: "🟣",
    feedUrl: "https://www.podiuminfo.nl/podium/5623/concerten/NAR-Cafe-der-Kunsten/Utrecht/",
  },
  {
    id: "tivoli-vredenburg",
    name: "TivoliVredenburg",
    color: "#e84b3a",
    icon: "🎵",
    feedUrl: "https://www.podiuminfo.nl/podium/3071/concerten/TivoliVredenburg/Utrecht/",
  },
  {
    id: "rpg-night-utrecht",
    name: "RPG Night Utrecht",
    color: "#6366f1",
    icon: "🎲",
    feedUrl: "https://warhorn.net/events/rpg-night-utrecht/schedule.atom",
  },
  {
    id: "beton-t",
    name: "Beton-T",
    color: "#f97316",
    icon: "🏗️",
    feedUrl: "https://www.vechtclub.nl/beton-t/agenda",
  },
  {
    id: "acu-utrecht",
    name: "ACU Utrecht",
    color: "#84cc16",
    icon: "✊",
    feedUrl: "https://acu.nl/agenda",
  },
]
