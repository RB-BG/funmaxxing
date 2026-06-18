# funmaxxing

Een speelse event-kiezer met **scenes** waartussen je schakelt: Utrechtse podia
(concerten, clubnachten, RPG-avonden) en **Buhurt Europe** (geharnaste toernooien en
fight nights door heel Europa). Selecteer events en exporteer ze als `.ics` of voeg ze
toe aan Google Agenda. Per scene een eigen filter: Utrecht op interesse (Game/D&B/00s),
Buhurt op land.

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

funmaxxing wordt op termijn meer dan een agenda (eigen tv-zender, radio, etc.). De code is
daarom opgezet als losse "apps" onder een gedeelde, speelse indie-web UI-laag.

## Stack

- **Vite 8** + **React 19** + **TypeScript 6**
- **Tailwind CSS 4** (via `@tailwindcss/vite`) + **shadcn** (`base-nova`) + `tw-animate-css`
- **framer-motion** (cursor, animaties), **canvas-confetti**, **react-fast-marquee**
- Fonts: **Geist** (alle UI-tekst, leesbaar) + **VT323** (retro hero/cijfers)
- Geluid via de **Web Audio API** (gesynthetiseerd, geen audio-assets)
- Path-alias `@ -> ./src`, ESLint flat config (typescript-eslint + react-hooks)
- Deploy op **Vercel** (Vite-preset, `vercel.json` met SPA-rewrite)

## Project-structuur

```
public/events.json        # live eventdata (gegenereerd door scraper)
scripts/scrape.mjs        # scraper: feeds/JSON-LD/HTML → public/events.json
scripts/manual-buhurt.mjs # handmatige buhurt club nights (DISØRDER etc.)
.github/workflows/        # sync-events.yml: dagelijkse cron
src/
  main.tsx                # React entrypoint
  App.tsx                 # providers + cursor + stickers, boot de agenda-app
  index.css               # Tailwind + palette + theme tokens
  types.ts                # EventItem / Source / EnrichedEvent / Category
  shell/AppRegistry.ts    # lijst van apps (lazy) — basis voor toekomstige desktop-shell
  ui/                     # gedeelde primitives (sound, cursor, WordArt, marquee, Panel/RetroButton, error boundary)
  lib/                    # utils (cn), classify, calendar (ICS/gcal)
  apps/
    agenda/               # de events-app: AgendaApp.tsx, scenes.ts, components/ (EventCard, Sidebar)
  data/sources.ts         # venue-referentieconfig
```

## Documentatie

Diepere uitleg staat in [`docs/`](docs/):
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — apps/shell/ui/lib-opzet en dataflow
- [docs/ADDING-AN-APP.md](docs/ADDING-AN-APP.md) — een nieuw appje toevoegen
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — palette, fonts, primitives, a11y
- [docs/CONTENT.md](docs/CONTENT.md) — venues/events beheren

## Development

```bash
npm install
npm run dev       # start de dev server
npm run build     # tsc -b && vite build
npm run lint      # eslint
npm run preview   # preview de productie-build
npm run scrape    # haal verse events op en schrijf public/events.json
```

## Venues

| Venue | Bron | Link |
|---|---|---|
| dB's Utrecht | iCal feed (dbstudio.nl) | eigen site |
| EKKO Utrecht | Podiuminfo JSON-LD | podiuminfo.nl |
| De Helling | HTML (dehelling.nl) | eigen site |
| NAR Café der Kunsten | Podiuminfo JSON-LD | podiuminfo.nl |
| TivoliVredenburg | Podiuminfo JSON-LD | podiuminfo.nl |
| RPG Night Utrecht | Warhorn Atom feed | warhorn.net |
| Beton-T | HTML (vechtclub.nl) | eigen site |
| ACU Utrecht | RSS feed (The Events Calendar) | eigen site |
| BASIS | iCal feed (The Events Calendar) | eigen site |
| Strand Oog in Al | RSS + tekst-datumparser | eigen site |

EKKO en TivoliVredenburg zijn JS-rendered (geen eigen feed beschikbaar), daarom via Podiuminfo.
NAR heeft momenteel geen events op Podiuminfo; pikt automatisch op zodra ze publiceren.
Naast Utrecht is er een **Buhurt Europe**-scene (zie [docs/CONTENT.md](docs/CONTENT.md)).

### Onderzochte venues die niet zijn toegevoegd

| Venue | Gebouwd op | Blocker |
|---|---|---|
| Werkspoorkathedraal | Next.js | Geen structured data, Podiuminfo-profiel leeg |
| Stathe | Wix | Wix geeft geen publieks-toegankelijke feed |
| Kabul à Gogo | Webflow | Geen feed; datums als proza (wel mogelijk via fragiele HTML-parser, zie docs) |
| Café Hofman | WordPress | Geen The Events Calendar plugin, alleen blogposts |
| De Nijverheid (Utrecht) | WordPress/Divi | Divi zonder evenementenplugin, geen /events-endpoint |
| Winkel van Sinkel / Café RASA | onbekend | Site offline |
| Subcultures | eigen site | Spellenwinkel, organiseert geen eigen events |
| Willem Twee | eigen site | Den Bosch, buiten Utrecht-scope |

Zie [docs/CONTENT.md](docs/CONTENT.md) voor volledige bevindingen per venue (wat geprobeerd, alternatieve aanpak).

## Venue toevoegen

1. Voeg de venue toe in `src/data/sources.ts` (id, name, color, icon, feedUrl)
2. Voeg dezelfde entry toe in `scripts/scrape.mjs` in de `VENUES` array
3. Implementeer een scraper-functie (zie bestaande voorbeelden) of gebruik `podiuminfo` als type
4. Run `npm run scrape` om te testen
5. Commit — de cron houdt het daarna automatisch bij
