# Local Events Utrecht (funmaxxing)

Een kleine event-kiezer voor Utrechtse podia. Selecteer concerten, clubnachten en
RPG-avonden en exporteer ze als `.ics` of voeg ze direct toe aan Google Agenda.
Events worden automatisch geclassificeerd op interesse (Game concerten, Drum & Bass,
Zeroes & Heroes) via keyword-matching.

## Hoe het werkt

De frontend laadt `public/events.json` bij elke pageopen via `fetch`. Die JSON wordt
dagelijks om 07:00 ververst door een GitHub Actions cron job (`sync-events.yml`), die
de scraper draait en het resultaat commit. Vercel pikt de commit op en rebuildt.

```
GitHub Actions (dagelijks 07:00 CEST)
  └─ node scripts/scrape.mjs
       ├─ Podiuminfo: JSON-LD (MusicEvent) uit HTML
       └─ Warhorn: Atom XML feed
  └─ commit public/events.json → Vercel rebuild

Frontend (Vercel)
  └─ fetch('/events.json') bij page load → React state → render
```

## Stack

- **Vite 8** + **React 19** + **TypeScript 6**
- **Tailwind CSS 4** (via `@tailwindcss/vite`) + **shadcn** (`base-nova`) + `tw-animate-css`
- **lucide-react** iconen, **framer-motion**, **Geist** variable font
- Path-alias `@ -> ./src`, ESLint flat config (typescript-eslint + react-hooks)
- Deploy op **Vercel** (Vite-preset, `vercel.json` met SPA-rewrite)

## Project-structuur

```
public/
  events.json           # live eventdata (gegenereerd door scraper)
scripts/
  scrape.mjs            # scraper: Podiuminfo + Warhorn → public/events.json
.github/workflows/
  sync-events.yml       # dagelijkse cron + workflow_dispatch
src/
  main.tsx              # React entrypoint
  App.tsx               # rendert EventsPage
  index.css             # Tailwind + shadcn theme tokens
  types.ts              # EventItem / Source / EnrichedEvent / Category
  data/
    sources.ts          # venue-config (id, name, color, icon, feedUrl)
  lib/
    utils.ts            # cn() helper
    classify.ts         # keyword-classificatie + filter-metadata
    calendar.ts         # ICS-generatie, Google Agenda-URL, download
  components/
    FilterBar.tsx       # interesse-filters
    EventCard.tsx       # event-kaart met selectie
    ActionBar.tsx       # sticky balk: alles / wissen / download
  pages/
    EventsPage.tsx      # state, dag-groepering, compositie
```

## Development

```bash
npm install
npm run dev       # start de dev server
npm run build     # tsc -b && vite build
npm run lint      # eslint
npm run preview   # preview de productie-build
npm run scrape    # haal verse events op en schrijf public/events.json
```

## Venue toevoegen

1. Voeg de venue toe in `src/data/sources.ts` (id, name, color, icon, feedUrl)
2. Voeg dezelfde entry toe in `scripts/scrape.mjs` in de `VENUES` array
3. Run `npm run scrape` om te testen
4. Commit — de cron houdt het daarna automatisch bij
