# Local Events Utrecht (funmaxxing)

Een kleine event-kiezer voor Utrechtse podia. Selecteer concerten, clubnachten en
RPG-avonden en exporteer ze als `.ics` of voeg ze direct toe aan Google Agenda.
Events worden automatisch geclassificeerd op interesse (Game concerten, Drum & Bass,
Zeroes & Heroes) via keyword-matching.

## Stack

Dezelfde stack en structuur als [`personal-website`](https://github.com/RB-BG/personal-website):

- **Vite 8** + **React 19** + **TypeScript 6**
- **Tailwind CSS 4** (via `@tailwindcss/vite`) + **shadcn** (`base-nova`) + `tw-animate-css`
- **lucide-react** iconen, **framer-motion**, **Geist** variable font
- Path-alias `@ -> ./src`, ESLint flat config (typescript-eslint + react-hooks)
- Deploy op **Vercel** (Vite-preset, `vercel.json` met SPA-rewrite)

## Project-structuur

```
src/
  main.tsx              # React entrypoint
  App.tsx               # rendert EventsPage
  index.css             # Tailwind + shadcn theme tokens
  types.ts              # EventItem / Source / EnrichedEvent / Category
  data/
    sources.ts          # venues + events (dagelijks ververst door Cowork-taak)
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
```

## Events toevoegen

Voeg een venue of event toe in [`src/data/sources.ts`](src/data/sources.ts). De
dagelijkse Cowork scheduled task (`warhorn-events-sync`) houdt dit bestand
automatisch up-to-date via Podiuminfo en de Warhorn Atom-feed.
