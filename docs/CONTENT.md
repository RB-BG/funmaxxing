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

## LARP-weekenden (scene middeleeuwen)
- Bron `larp-platform` (`type: 'larp-platform'`) scrapet
  [larp-platform.nl/evenementenoverzicht](https://www.larp-platform.nl/evenementenoverzicht/),
  de gedeelde agenda voor larp in Nederland en België. De hele agenda (100+ events, tot en met
  2029) staat op één pagina als `.event-card`-blokken — geen paginering, dus één fetch is genoeg.
- **Geen feed beschikbaar.** De site draait op WordPress met een `evenement` custom post type dat
  wél via `wp-json/wp/v2/evenement` te bereiken is, maar dat endpoint geeft alleen de *post*-datums
  (`date`, `modified`, `absolute_dates`); de eigenlijke evenementdatum zit niet in de REST-output
  en `acf` is leeg. The Events Calendar (`wp-json/tribe/...`) is niet geïnstalleerd. Daarom HTML.
- **Filter: alleen meerdaagse events.** Dat zijn precies de grootschalige weekend-larps; het houdt
  de losse avondsessies buiten de deur (Vampire Utrecht, Stormvloed en andere short larps).
  Wil je die er wél bij, haal dan de `endStr === startStr`-check uit `scrapeLarpPlatform` weg.
- De kaartjes leveren ook genre (`High-fantasy`, `Post-Apo`, `Steampunk`, …), slaapvorm en
  leeftijdsgrens; die gaan als `tags` en `description` mee. `country` wordt uit de locatie
  afgeleid (België of Nederland), maar de middeleeuwen-scene facet op bronnaam, niet op land.
- De agenda geeft alleen dagen, geen tijden. De scraper zet daarom `T00:00:00` als start — het
  date-only-signaal dat `EventCard` gebruikt om de tijdregel te verbergen (zoals Beton-T) — en
  `T23:59:00` op de laatste dag, zodat de .ics/Google-Agenda-export het hele weekend dekt.

### Mega-larps (bron `larp-mega`)
De larps op festivalschaal (duizenden spelers) staan met de hand in
[`scripts/manual-larp.mjs`](../scripts/manual-larp.mjs), als aparte bron zodat ze hun eigen
filterchip krijgen naast de weekend-larps. Handmatig en niet gescrapet, om twee redenen:
"mega" is een redactionele keuze die in geen enkele feed staat, en elke organisator heeft een
eigen single-event site zonder agenda-feed. Verleden edities mogen blijven staan tot de volgende
datum bekend is — `main()` filtert ze eruit.

| Evenement | Land | Schaal | Bron voor de datum |
|---|---|---|---|
| ConQuest of Mythodea | Duitsland | ~7000 spelers + 2000 NPC's | [realmsofmythodea.com](https://realmsofmythodea.com/en/conquest-of-mythodea/) |
| DrachenFest | Duitsland | ~7000 spelers | [drachenfest-ticketshop.info](https://www.drachenfest-ticketshop.info/termine-df-und-zdl) |
| Empire (Profound Decisions) | Verenigd Koninkrijk | 4 events/jaar, 2000+ per event | [profounddecisions.co.uk](https://www.profounddecisions.co.uk/empire-wiki/Events) |

**Onderzocht maar niet toegevoegd (geen bevestigde datum):**

| Evenement | Land | Reden |
|---|---|---|
| Epic Empires | Duitsland | Editie 2026 (19–23 aug, Bexbach) is geweest; op `epic-empires.de` staat nog geen datum voor 2027 |
| Lorien Trust — The Gathering | Verenigd Koninkrijk | Vaste plek (augustus bank holiday) maar geen gepubliceerde datum; `lrptickets.co.uk` toont alleen de kleinere factie-events |
| College of Wizardry | Polen | Laatste editie (CoW 27) was dec 2025; Dziobak/Witchards heeft nog geen volgende datum aangekondigd |

Kom je een bevestigde datum tegen? Voeg 'm toe aan `manual-larp.mjs`.

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
