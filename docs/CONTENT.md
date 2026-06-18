# Content beheren (venues & events)

De agenda toont events uit [`public/events.json`](../public/events.json). Dat bestand wordt
gegenereerd door de scraper en dagelijks ververst door een GitHub Action — je bewerkt het
nooit met de hand.

## Dataflow
```
scripts/scrape.mjs  →  public/events.json  →  AgendaApp fetch('/events.json')
```
`events.json` heeft de vorm `{ updatedAt, sources: [{ id, name, color, icon, scene, feedUrl, events[] }] }`.
Een event is `{ id, title, start, end, location, description?, url, tags[], country? }` (zie
[`src/types.ts`](../src/types.ts)).

## Scenes
Elke bron heeft een `scene` (stad/onderwerp waartussen de app schakelt), bijv. `utrecht` of
`buhurt`. De presentatie per scene (naam, hero-tekst, accentkleuren en hoe events in filters
worden ingedeeld) staat in [`src/apps/agenda/scenes.ts`](../src/apps/agenda/scenes.ts):
- **utrecht** filtert op interesse-categorie (GAME/DNB/NOS via `classify`).
- **buhurt** filtert op `country` (alleen Europese landen).

Een nieuwe scene = entry in `SCENES` (met `facetsOf`/`facetLabel`) plus bronnen met die `scene`.

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

## Een venue/bron toevoegen
1. Voeg de bron toe aan de `VENUES`-array in [`scripts/scrape.mjs`](../scripts/scrape.mjs)
   (`id, name, color, icon, scene, type, feedUrl`).
2. Kies een `type`: hergebruik een bestaande scraper (`podiuminfo`, `warhorn`, `dbs-ical`,
   `buhurt-wob`, …) of schrijf een nieuwe `scrapeX(venue)`-functie en sluit 'm aan in `scrapeVenue()`.
3. `npm run scrape` om te testen, daarna committen — de cron houdt het daarna bij.

## Buhurt (scene buhurt)
- **Toernooien** komen automatisch van [worldofbuhurt.com/tournaments](https://www.worldofbuhurt.com/tournaments)
  (`type: 'buhurt-wob'`), gefilterd op Europese landen via `EUROPEAN_COUNTRIES` in `scrape.mjs`.
- **Club nights / fight nights** (zoals DISØRDER) staan in geen enkele feed en worden met de hand
  bijgehouden in [`scripts/manual-buhurt.mjs`](../scripts/manual-buhurt.mjs). Voeg daar een entry toe
  (`id, title, start, end, location, country, url, tags`); verleden events vallen vanzelf weg.
- Instagram (bv. @deathsectorbp) is niet publiek/automatisch te volgen; nieuwe club nights handmatig
  toevoegen in dat bestand.

## Feeds boven HTML
Geef altijd de voorkeur aan een echte feed (RSS/Atom/iCal) boven HTML-scrapen: stabieler en
minder breekbaar. Voorbeelden in gebruik: dB's (iCal), RPG Night (Warhorn Atom), ACU (RSS via
The Events Calendar). HTML/JSON-LD alleen als er geen feed is.

## Interesse-classificatie
Events worden geclassificeerd in GAME / DNB / NOS via keyword-matching in
[`src/lib/classify.ts`](../src/lib/classify.ts) — geen AI. Pas de `KEYWORDS` daar aan om de
filters bij te stellen, of voeg een categorie toe aan het `Category`-type en `FILTER_META`.
