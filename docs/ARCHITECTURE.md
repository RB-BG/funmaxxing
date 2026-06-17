# Architectuur

funmaxxing is één Vite + React-app die is opgezet als een verzameling losse **"apps"** onder
een gedeelde, speelse UI-laag. Vandaag is er één app (de agenda); later komen er meer bij
(tv-zender, radio, etc.). De structuur is bewust gekozen zodat die toekomstige apps erbij
kunnen zonder herschrijven, en zodat er uiteindelijk een PostHog-achtige "desktop met appjes"
omheen kan.

## Lagen

```
src/
  shell/        # hoe apps worden ontsloten (nu: boot direct; later: desktop met vensters)
  apps/<naam>/  # zelfstandige feature-app, lazy-loaded
  ui/           # app-overstijgende, herbruikbare speelse primitives
  lib/          # app-overstijgende, functionele helpers (geen UI)
  data/         # statische referentieconfig
```

- **`shell/AppRegistry.ts`** — de bron van waarheid voor "welke apps bestaan er". Elke app is
  `{ id, name, icon, Component }`, waarbij `Component` een `React.lazy()`-import is. Vandaag
  rendert [`App.tsx`](../src/App.tsx) simpelweg `APPS[0]`. Zodra er meerdere apps zijn, kan een
  desktop-shell deze lijst als icoontjes/vensters renderen — de apps zelf veranderen niet.
- **`apps/agenda/`** — de agenda-app. Entry: [`AgendaApp.tsx`](../src/apps/agenda/AgendaApp.tsx)
  (default export, zodat `lazy()` werkt). Eigen `components/` map. Elke app zet z'n eigen skin
  via `skinVars(SKINS.<id>)` op de root (zie [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)).
- **`ui/`** — gedeelde primitives, niet app-specifiek: `SoundProvider`/`sound`, `CustomCursor`,
  `ErrorBoundary`, `WordArt`, `MarqueeBar`, `Retro` (`Panel`/`RetroPanel`/`RetroButton`), `theme`,
  `useMediaQuery`, `useReducedMotion`.
- **`lib/`** — pure functie-helpers zonder UI: `utils` (`cn`), `classify` (keyword-classificatie),
  `calendar` (ICS-generatie + Google Agenda-URL + download).

## Providers

[`App.tsx`](../src/App.tsx) wikkelt alles in een `<ErrorBoundary>` + `<SoundProvider>` en rendert
daarnaast `<CustomCursor>` (globaal). Bij de eerste sessie-load toont het eerst de
`<BootScreen>` (FUNMAXX OS cold-open); pas daarna mount de actieve app in een `<Suspense>`. De
custom cursor en het boot-scherm schakelen zichzelf uit bij `prefers-reduced-motion`; het
boot-scherm verschijnt één keer per sessie (`sessionStorage`) en is skipbaar.

## Dataflow (agenda)

```
scripts/scrape.mjs   (lokaal of via GitHub Actions cron, 1x/dag)
  └─ haalt per venue events op (RSS/Atom/iCal feed of JSON-LD/HTML)
  └─ schrijft public/events.json  { updatedAt, sources: [{ id, name, color, icon, events[] }] }

AgendaApp.tsx
  └─ fetch('/events.json') bij mount
  └─ buildEvents(): flat + classify() per event  → EnrichedEvent[]
  └─ filter (FilterBar) → sorteer op datum → groepeer per dag → render EventCards
  └─ selectie in een Set<id>; ActionBar → downloadICS() / per-event Google Agenda-link
```

Zie [CONTENT.md](CONTENT.md) voor het beheren van venues/events en de scraper.

## Waarom geen monorepo / micro-frontends (nu)
Voor een solo-project met een gedeelde shell is één Vite-app met lazy-loaded `apps/*` de laagste
overhead: één deploy, instant navigatie tussen appjes, gedeelde UI zonder package-grenzen. Een
pnpm/Turborepo-monorepo of Module Federation voegt isolatie toe die we nu niet nodig hebben; dat
kan later als een app echt een eigen deploy-cadans of standalone-site nodig heeft.
