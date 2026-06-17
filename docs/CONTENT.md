# Content beheren (venues & events)

De agenda toont events uit [`public/events.json`](../public/events.json). Dat bestand wordt
gegenereerd door de scraper en dagelijks ververst door een GitHub Action — je bewerkt het
nooit met de hand.

## Dataflow
```
scripts/scrape.mjs  →  public/events.json  →  AgendaApp fetch('/events.json')
```
`events.json` heeft de vorm `{ updatedAt, sources: [{ id, name, color, icon, feedUrl, events[] }] }`.
Een event is `{ id, title, start, end, location, description?, url, tags[] }` (zie
[`src/types.ts`](../src/types.ts)).

## Lokaal verversen
```bash
npm run scrape
```
De scraper haalt per venue events op (RSS/Atom/iCal feed waar mogelijk, anders JSON-LD of HTML),
filtert alles vóór vandaag eruit, en schrijft `events.json`. Faalt één venue, dan blijft de
laatste goede data voor dat venue staan (de andere venues gaan gewoon door).

## Automatisch (cron)
[`.github/workflows/sync-events.yml`](../.github/workflows/sync-events.yml) draait `scrape.mjs`
elke dag (05:00 UTC) en commit `events.json` als er iets is veranderd. Vercel rebuildt op die
commit. Gebruikt alleen de automatische `GITHUB_TOKEN` — geen externe API-keys of AI/LLM-tokens.

## Een venue toevoegen
1. Voeg de venue toe aan de `VENUES`-array in [`scripts/scrape.mjs`](../scripts/scrape.mjs)
   (`id, name, color, icon, type, feedUrl`).
2. Kies een `type`: hergebruik een bestaande scraper (`podiuminfo`, `warhorn`, `dbs-ical`, …) of
   schrijf een nieuwe `scrapeX(venue)`-functie en sluit 'm aan in `scrapeVenue()`.
3. Spiegel de venue-metadata in [`src/data/sources.ts`](../src/data/sources.ts) (referentieconfig).
4. `npm run scrape` om te testen, daarna committen — de cron houdt het daarna bij.

## Feeds boven HTML
Geef altijd de voorkeur aan een echte feed (RSS/Atom/iCal) boven HTML-scrapen: stabieler en
minder breekbaar. Voorbeelden in gebruik: dB's (iCal), RPG Night (Warhorn Atom), ACU (RSS via
The Events Calendar). HTML/JSON-LD alleen als er geen feed is.

## Interesse-classificatie
Events worden geclassificeerd in GAME / DNB / NOS via keyword-matching in
[`src/lib/classify.ts`](../src/lib/classify.ts) — geen AI. Pas de `KEYWORDS` daar aan om de
filters bij te stellen, of voeg een categorie toe aan het `Category`-type en `FILTER_META`.
