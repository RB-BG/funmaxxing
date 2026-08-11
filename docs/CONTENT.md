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

## Brommer Tours (scene brommer)
- **Nederland** heeft wél een goede bron: [brommerritten.nl](https://brommerritten.nl/ritten/)
  draait op WordPress met de "The Events Calendar"-plugin en heeft dus dezelfde JSON REST feed
  als Lab Monkey/Ducosim (`type: 'tribe'`, zie `scrapeTribe` in `scrape.mjs`). Bron
  `brommerritten-nl` in `VENUES` haalt hiermee automatisch alle NL-toertochten op
  (192 events voor 2026 bij het schrijven van dit stuk, incl. Beltrum, Zijtaart Bromt Meer en
  alle Batavus-clubritten).
- **België** heeft geen vergelijkbare bron. `oldtimerweb.be`'s `?c=bromfietsen`-filter is wél
  een echte, scrapebare HTML-lijst (geen JS-rendering, geen paginering), maar bij controle
  bevatte die lijst geen van de specifieke BE-clubritten die hieronder staan (Aardbeirit,
  Avondrit Maaseiker, Aa-Beeckrit, Torhoutse Kastelentocht) — de site categoriseert ze kennelijk
  niet als "bromfietsen", dus de filter is niet betrouwbaar genoeg om op te automatiseren.
  `brommer.nl` (dat wél NL+BE-events toont) is volledig JS-rendered zonder publieke API
  (`/wp-json/events-manager/v1/events` geeft `401 rest_forbidden`).
- Alles wat niet via `brommerritten-nl` binnenkomt (BE-evenementen, meerdaagse tours zoals
  Rust 'N Dust, en beurzen zoals MotoVelo) staat met de hand in
  [`scripts/manual-brommer.mjs`](../scripts/manual-brommer.mjs)
  (`id, title, start, end, location, country, description, url, tags`), na verificatie van
  datum/locatie/url via websearch. Facet is `country` (Nederland/België), net als bij buhurt.

### Onderzocht maar niet toegevoegd (geen bevestigde 2026-datum)
| Evenement | Locatie | Reden |
|---|---|---|
| Bromvliegers Voorjaarsrit | Venhorst | "Jaarlijks lente" — editie 2026 al geweest, volgende datum onbekend |
| Holder De Polder | Rosmalen | "Jaarlijks augustus" — editie 2026 al geweest, geen vaste kalenderdatum gevonden |
| Gaasterlandse Bromfiets Toertocht | Balk/Harich | Geen bevestigde 2026-datum gevonden (laatst bekende editie: okt 2022) |
| Bromfietsclub 6-Volt | Gullegem | Geen concrete ritdatum voor 2026 gevonden, enkel een winterweekend |
| Moms & Dads on Mopeds | Kapellen | Geen editie sinds 2011 teruggevonden |

Kom je een bevestigde datum tegen voor een van deze? Voeg 'm toe aan `manual-brommer.mjs`.

## Feeds boven HTML
Geef altijd de voorkeur aan een echte feed (RSS/Atom/iCal) boven HTML-scrapen: stabieler en
minder breekbaar. Voorbeelden in gebruik: dB's (iCal), RPG Night (Warhorn Atom), ACU (RSS via
The Events Calendar). HTML/JSON-LD alleen als er geen feed is.

## Interesse-classificatie
Events worden geclassificeerd in GAME / DNB / NOS via keyword-matching in
[`src/lib/classify.ts`](../src/lib/classify.ts) — geen AI. Pas de `KEYWORDS` daar aan om de
filters bij te stellen, of voeg een categorie toe aan het `Category`-type en `FILTER_META`.

---

## Onderzochte venues die (nog) niet zijn toegevoegd

Hieronder de venues die zijn bekeken en waarom ze niet in de scraper staan. Bewaard zodat
toekomstige sessies niet opnieuw het wiel uitvinden.

### Utrecht

| Venue | Gebouwd op | Wat geprobeerd | Blocker |
|---|---|---|---|
| Werkspoorkathedraal | Next.js | HTML-scraping, Podiuminfo gezocht | Geen structured data (JSON-LD/microdata); Podiuminfo-profiel leeg |
| Stathe | Wix | RSS/Atom, Wix-feed URLs gezocht | Wix levert geen publieks-toegankelijke feed; events alleen als losse tekst op de pagina |
| Kabul à Gogo | Webflow | RSS/Atom, JSON-LD | Geen feed; datums zijn proza ("komende vrijdag") zonder machine-leesbaar formaat |
| Café Hofman | WordPress | WordPress-feed (`/feed/`, `/events/feed/`) | WordPress zonder The Events Calendar plugin — alleen blogposts, geen events |
| De Nijverheid (Utrecht) | WordPress/Divi | WordPress-feed, iCal | Divi-thema zonder evenementenplugin; geen /events-endpoint |
| Winkel van Sinkel | ? | Site gezocht | Domein offline ten tijde van onderzoek |
| Café RASA | ? | Site gezocht | Domein offline ten tijde van onderzoek |
| Subcultures | eigen site | Sitestructuur bekeken | Spellenwinkel, organiseert geen eigen events |
| Willem Twee | eigen site | Gecontroleerd | Zit in Den Bosch, valt buiten Utrecht-scope |

**Kabul à Gogo: mogelijke toekomstige aanpak.** De event-URLs volgen het patroon
`/events/YYYYMMDD-naam`. Met een headless browser (Playwright) of een fragiele `fetch` +
cheerio-HTML-parser is een datumlijst te bouwen. Niet gedaan omdat het breekbaarder is dan
een feed — maar haalbaar als er vraag naar is.

**Werkspoorkathedraal: mogelijk via Podiuminfo.** Ze staan als venue op Podiuminfo.nl maar
hadden bij onderzoek geen actieve events gepubliceerd. Als ze dat gaan doen, pikt de
`podiuminfo`-scraper ze automatisch op zodra je het Podiuminfo-profiel-ID toevoegt.

### Buhurt (Europa)

| Bron | Wat geprobeerd | Status |
|---|---|---|
| buhurtinternational.com | HTML-scraping, RSS | Site geladen maar events niet machine-leesbaar in HTML; geen feed gevonden |
| Instagram @deathsectorbp | Instagram API, scraping | Instagram API vereist app-goedkeuring en user-token; publieke HTML is niet scrapable zonder headless browser |

Voor buhurt club nights (zoals DISØRDER) is handmatig bijhouden in
[`scripts/manual-buhurt.mjs`](../scripts/manual-buhurt.mjs) de enige werkbare aanpak zolang
er geen publieks-toegankelijke agenda-feed bestaat.
