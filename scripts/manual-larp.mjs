/**
 * Manually curated LARP mega-events in Europe — the handful of larps that run at
 * festival scale (thousands of players) instead of the club/weekend scale that
 * larp-platform.nl covers (see `larp-platform` in VENUES, scene `middeleeuwen`).
 *
 * These are curated by hand on purpose: "mega" is an editorial judgement that no
 * feed encodes, and each organiser runs a single-event site without an agenda
 * feed. Add an entry with id, title, ISO start/end (with timezone offset),
 * location, country, description, url and tags, after verifying the date against
 * the organiser's own site. Past events are filtered out automatically by
 * `main()` in scrape.mjs, so old editions can stay until the next one is known.
 *
 * Dates are day-only (the organisers publish arrival days, not schedules), so
 * these follow the same T00:00:00 → T23:59:00 convention as `scrapeLarpPlatform`.
 */
export const MANUAL_LARP = [
  // Duitsland — de twee grootste larps van Europa.
  {
    id: 'conquest-of-mythodea-2027',
    title: 'ConQuest of Mythodea 2027',
    start: '2027-08-04T00:00:00+02:00',
    end: '2027-08-08T23:59:00+02:00',
    location: 'Rittergut Brokeloh, Landesbergen (Niedersachsen)',
    country: 'Duitsland',
    description: "De grootste larp ter wereld: elk jaar in augustus komen zo'n 7000 spelers en 2000 NPC's naar Brokeloh om de wereld Mythodea te spelen. Editie 2027: Gefallene Götter.",
    url: 'https://realmsofmythodea.com/en/conquest-of-mythodea/',
    tags: ['Mega-larp', 'High-fantasy'],
  },
  {
    id: 'drachenfest-2027',
    title: 'DrachenFest 2027',
    start: '2027-07-27T00:00:00+02:00',
    end: '2027-08-01T23:59:00+02:00',
    location: 'Larpgelände Waldeck, Waldeck am Edersee (Hessen)',
    country: 'Duitsland',
    description: 'Grootschalige kamp- en veldslaglarp waarbij spelers zich bij een van de drakenkampen aansluiten. Sinds 2026 op een nieuw terrein in Waldeck am Edersee (t/m 2025 in Diemelstadt). Vroege aankomst mogelijk op 25 en 26 juli.',
    url: 'https://www.drachenfest-ticketshop.info/termine-df-und-zdl',
    tags: ['Mega-larp', 'High-fantasy'],
  },

  // Verenigd Koninkrijk — Empire (Profound Decisions), vier events per jaar op
  // hetzelfde terrein, elk met zo'n 2000+ spelers.
  {
    id: 'empire-autumn-equinox-2026',
    title: 'Empire — Autumn Equinox',
    start: '2026-09-11T00:00:00+01:00',
    end: '2026-09-13T23:59:00+01:00',
    location: 'Steeplechase LRP Centre, Beach Road, Cottenham (Cambridgeshire)',
    country: 'Verenigd Koninkrijk',
    description: 'Een van de vier jaarlijkse Empire-events van Profound Decisions: politiek, veldslagen en rituelen in het fictieve Empire, met ruim 2000 spelers per event.',
    url: 'https://www.profounddecisions.co.uk/empire-wiki/Events',
    tags: ['Mega-larp', 'High-fantasy'],
  },
  {
    id: 'empire-winter-solstice-2027',
    title: 'Empire — Winter Solstice',
    start: '2027-04-23T00:00:00+01:00',
    end: '2027-04-25T23:59:00+01:00',
    location: 'Steeplechase LRP Centre, Beach Road, Cottenham (Cambridgeshire)',
    country: 'Verenigd Koninkrijk',
    description: 'Een van de vier jaarlijkse Empire-events van Profound Decisions: politiek, veldslagen en rituelen in het fictieve Empire, met ruim 2000 spelers per event.',
    url: 'https://www.profounddecisions.co.uk/empire-wiki/Events',
    tags: ['Mega-larp', 'High-fantasy'],
  },
  {
    id: 'empire-spring-equinox-2027',
    title: 'Empire — Spring Equinox',
    start: '2027-06-11T00:00:00+01:00',
    end: '2027-06-13T23:59:00+01:00',
    location: 'Steeplechase LRP Centre, Beach Road, Cottenham (Cambridgeshire)',
    country: 'Verenigd Koninkrijk',
    description: 'Een van de vier jaarlijkse Empire-events van Profound Decisions: politiek, veldslagen en rituelen in het fictieve Empire, met ruim 2000 spelers per event.',
    url: 'https://www.profounddecisions.co.uk/empire-wiki/Events',
    tags: ['Mega-larp', 'High-fantasy'],
  },
  {
    id: 'empire-summer-solstice-2027',
    title: 'Empire — Summer Solstice',
    start: '2027-07-30T00:00:00+01:00',
    end: '2027-08-01T23:59:00+01:00',
    location: 'Steeplechase LRP Centre, Beach Road, Cottenham (Cambridgeshire)',
    country: 'Verenigd Koninkrijk',
    description: 'Een van de vier jaarlijkse Empire-events van Profound Decisions: politiek, veldslagen en rituelen in het fictieve Empire, met ruim 2000 spelers per event.',
    url: 'https://www.profounddecisions.co.uk/empire-wiki/Events',
    tags: ['Mega-larp', 'High-fantasy'],
  },
  {
    id: 'empire-autumn-equinox-2027',
    title: 'Empire — Autumn Equinox',
    start: '2027-09-17T00:00:00+01:00',
    end: '2027-09-19T23:59:00+01:00',
    location: 'Steeplechase LRP Centre, Beach Road, Cottenham (Cambridgeshire)',
    country: 'Verenigd Koninkrijk',
    description: 'Een van de vier jaarlijkse Empire-events van Profound Decisions: politiek, veldslagen en rituelen in het fictieve Empire, met ruim 2000 spelers per event.',
    url: 'https://www.profounddecisions.co.uk/empire-wiki/Events',
    tags: ['Mega-larp', 'High-fantasy'],
  },
]
