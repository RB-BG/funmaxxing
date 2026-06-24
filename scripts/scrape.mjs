import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MANUAL_BUHURT } from './manual-buhurt.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../public/events.json')

// Each source belongs to a "scene" (a city/topic the app can switch between).
const VENUES = [
  { id: 'dbs-utrecht',       name: "dB's Utrecht",         color: '#ef4444', icon: '🎸', scene: 'utrecht', type: 'dbs-ical',   feedUrl: 'https://dbstudio.nl/events/?ical=1' },
  { id: 'ekko-utrecht',      name: 'EKKO Utrecht',          color: '#0ea5e9', icon: '🔵', scene: 'utrecht', type: 'ekko-wp',    feedUrl: 'https://ekko.nl/wp-json/wp/v2/event' },
  { id: 'de-helling',        name: 'De Helling',            color: '#22c55e', icon: '🟢', scene: 'utrecht', type: 'helling',    feedUrl: 'https://dehelling.nl/agenda' },
  { id: 'nar-utrecht',       name: 'NAR Café der Kunsten',  color: '#a855f7', icon: '🟣', scene: 'utrecht', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/5623/concerten/NAR-Cafe-der-Kunsten/Utrecht/' },
  { id: 'tivoli-vredenburg', name: 'TivoliVredenburg',      color: '#e84b3a', icon: '🎵', scene: 'utrecht', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/3071/concerten/TivoliVredenburg/Utrecht/' },
  { id: 'gietijzer',        name: 'Gietijzer',             color: '#7c3aed', icon: '🏭', scene: 'utrecht', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/6061/concerten/m-1/Gietijzer/Utrecht/' },
  { id: 'rpg-night-utrecht', name: 'RPG Night Utrecht',     color: '#6366f1', icon: '🎲', scene: 'games',   type: 'warhorn',    feedUrl: 'https://warhorn.net/events/rpg-night-utrecht/schedule.atom' },
  { id: 'lab-monkey',        name: 'Lab Monkey',            color: '#16a34a', icon: '🃏', scene: 'games',   type: 'tribe',          feedUrl: 'https://www.lab-monkey.nl/wp-json/tribe/events/v1/events' },
  { id: 'casual-carnage',    name: 'Casual Carnage',        color: '#c2410c', icon: '🎯', scene: 'games',   type: 'casual-carnage', feedUrl: 'https://www.casualcarnage.nl/wp-json/wp/v2/evge_event' },
  { id: 'ducosim',           name: 'Ducosim',               color: '#7c3aed', icon: '🎲', scene: 'beurzen',   type: 'tribe',          feedUrl: 'https://www.ducosim.nl/wp-json/tribe/events/v1/events' },
  { id: 'weighted-dice',     name: 'Weighted Dice Utrecht', color: '#0891b2', icon: '🎯', scene: 'games',   type: 'ical',           feedUrl: 'https://www.meetup.com/weighted-dice-board-gaming-community/events/ical/' },

  // Beurzen scene (conventions & fairs)
  { id: 'dcc',              name: 'Heroes Dutch Comic Con', color: '#1d4ed8', icon: '🦸', scene: 'beurzen', type: 'dcc',              feedUrl: 'https://www.dutchcomiccon.com/' },
  { id: 'spellenspektakel', name: 'Spellenspektakel',       color: '#16a34a', icon: '🎲', scene: 'beurzen', type: 'spellenspektakel', feedUrl: 'https://spellenspektakel.nl/' },
  { id: 'abunai',           name: 'Abunai!',                color: '#e11d48', icon: '🌸', scene: 'beurzen', type: 'abunai',           feedUrl: 'https://abunaicon.nl/' },
  { id: 'animecon',         name: 'AnimeCon',               color: '#9333ea', icon: '⛩️', scene: 'beurzen', type: 'animecon',         feedUrl: 'https://animecon.nl/' },

  { id: 'beton-t',           name: 'Beton-T',               color: '#f97316', icon: '🏗️',  scene: 'utrecht', type: 'beton',     feedUrl: 'https://www.vechtclub.nl/beton-t/agenda' },
  { id: 'acu-utrecht',       name: 'ACU Utrecht',           color: '#84cc16', icon: '✊',   scene: 'utrecht', type: 'acu',       feedUrl: 'https://acu.nl/events/feed/' },
  { id: 'basis-utrecht',     name: 'BASIS',                 color: '#14b8a6', icon: '🔊', scene: 'utrecht', type: 'ical',      feedUrl: 'https://clubbasis.nl/events/?ical=1' },
  { id: 'soia-utrecht',      name: 'Strand Oog in Al',      color: '#eab308', icon: '🏖️', scene: 'utrecht', type: 'soia',      feedUrl: 'https://soia.nl/agenda/feed/' },

  // Middeleeuwen scene (fantasy fairs, medieval festivals, SCA)
  { id: 'polderslot-sca',         name: 'Polderslot (SCA)',       color: '#92400e', icon: '⚔️',  scene: 'middeleeuwen', type: 'drachenwald-sca',      feedUrl: 'https://dis.drachenwald.sca.org/data/calendar.json' },
  { id: 'castlefest',             name: 'Castlefest',             color: '#166534', icon: '🏰', scene: 'middeleeuwen', type: 'castlefest',           feedUrl: 'https://castlefest.nl/nl' },
  { id: 'elfia',                  name: 'Elfia',                  color: '#6d28d9', icon: '🧝', scene: 'middeleeuwen', type: 'elfia',                feedUrl: 'https://elfia.com' },
  { id: 'archeon',                name: 'Archeon',                color: '#b45309', icon: '🏛️', scene: 'middeleeuwen', type: 'archeon',              feedUrl: 'https://archeon.eu' },
  { id: 'kommus-kasteelfestival', name: 'KommuS Kasteelfestival', color: '#0f766e', icon: '🎭', scene: 'middeleeuwen', type: 'kommus-kasteelfestival', feedUrl: 'https://castlefestival.nl' },
  { id: 'muiderslot',           name: 'Muiderslot',             color: '#78350f', icon: '🏰', scene: 'middeleeuwen', type: 'muiderslot',           feedUrl: 'https://muiderslot.nl/ontdek-het-muiderslot/agenda/' },
  { id: 'slot-loevestein',      name: 'Slot Loevestein',        color: '#1e3a5f', icon: '⚔️',  scene: 'middeleeuwen', type: 'slot-loevestein',      feedUrl: 'https://www.slotloevestein.nl/agenda/' },
  { id: 'ruine-brederode',      name: 'Ruïne van Brederode',    color: '#713f12', icon: '🏚️', scene: 'middeleeuwen', type: 'ruine-brederode',      feedUrl: 'https://ruinevanbrederode.nl/activiteiten/' },
  { id: 'hoensbroek',           name: 'Kasteel Hoensbroek',     color: '#7c2d12', icon: '🛡️', scene: 'middeleeuwen', type: 'hoensbroek',           feedUrl: 'https://www.kasteelhoensbroek.nl/wat-is-er-te-doen/' },
  { id: 'montfort',             name: 'Middeleeuws Montfort',   color: '#14532d', icon: '⚔️',  scene: 'middeleeuwen', type: 'montfort',             feedUrl: 'https://middeleeuwsmontfort.nl/' },

  // Buhurt scene (medieval armored combat), Europe only.
  { id: 'buhurt-eu',         name: 'Buhurt toernooien (EU)', color: '#b61e1e', icon: '⚔️', scene: 'buhurt', type: 'buhurt-wob',    feedUrl: 'https://www.worldofbuhurt.com/tournaments' },
  { id: 'buhurt-clubnights', name: 'Buhurt club nights',     color: '#9b51e0', icon: '🛡️', scene: 'buhurt', type: 'buhurt-manual', feedUrl: '' },
  { id: 'buhurt-bi',         name: 'Buhurt International',   color: '#7f1d1d', icon: '⚔️', scene: 'buhurt', type: 'buhurt-bi',     feedUrl: 'https://www.buhurtinternational.com/tournaments' },
]

const NL_MONTHS = { jan:1, feb:2, mrt:3, apr:4, mei:5, jun:6, jul:7, aug:8, sep:9, okt:10, nov:11, dec:12 }

const EN_MONTHS = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
}

// Country names (as worldofbuhurt spells them) that count as European.
const EUROPEAN_COUNTRIES = new Set([
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Czech Republic',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland',
  'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Montenegro',
  'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'Serbia',
  'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Ukraine',
  'United Kingdom', 'UK', 'England', 'Scotland', 'Wales', 'Northern Ireland',
])

function parseDutchDate(str) {
  const parts = str.trim().split(/\s+/)
  if (parts.length < 3) return null
  const [day, mon, year] = parts
  const month = NL_MONTHS[mon.toLowerCase().slice(0, 3)]
  if (!month) return null
  const pad = n => String(n).padStart(2, '0')
  const tz = (month >= 4 && month <= 9) ? '+02:00' : '+01:00'
  return `${year}-${pad(month)}-${pad(parseInt(day))}T00:00:00${tz}`
}

function addHours(isoDate, hours) {
  return new Date(new Date(isoDate).getTime() + hours * 3_600_000).toISOString()
}

function decodeXml(str) {
  return str
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function stripCdata(str) {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

function truncate(str, max = 300) {
  if (str.length <= max) return str
  return str.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

async function scrapePodiuminfo(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const events = []
  for (const [, block] of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data
    try { data = JSON.parse(block.trim()) } catch { continue }

    const MUSIC_EVENT_TYPES = ['MusicEvent', 'Event', 'TheaterEvent', 'DanceEvent', 'ComedyEvent']
    if (!MUSIC_EVENT_TYPES.includes(data['@type'])) continue

    const url = data.url ?? ''
    const idMatch = url.match(/\/concert\/(\d+)\//)
    if (!idMatch) continue

    const loc = data.location
    const location = loc
      ? [loc.name, loc.address?.streetAddress, loc.address?.addressLocality].filter(Boolean).join(', ')
      : venue.name

    events.push({
      id: idMatch[1],
      title: (data.name ?? '').replace(/ @ .+$/, '').trim(),
      start: data.startDate,
      end: data.endDate ?? addHours(data.startDate, 3),
      location,
      description: truncate(data.description ?? ''),
      url,
      tags: [],
    })
  }

  return events
}

async function scrapeWarhorn(venue) {
  const res = await fetch(venue.feedUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()

  const events = []
  for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const title = decodeXml(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')
    const idMatch = entry.match(/\/sessions\/(\d+)/)
    const url = entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1] ?? venue.feedUrl
    const when = entry.match(/<gd:when startTime="([^"]+)" endTime="([^"]+)"/)
    const where = entry.match(/<gd:where valueString="([^"]+)"/)
    const rawContent = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? ''

    if (!title || !when) continue

    events.push({
      id: idMatch ? idMatch[1] : url.split('/').pop(),
      title,
      start: when[1],
      end: when[2],
      location: where ? decodeXml(where[1]) : 'Utrecht',
      description: truncate(stripHtml(decodeXml(rawContent))),
      url,
      tags: [],
    })
  }

  return events
}

/** Lab Monkey (Utrecht): Magic events via WooCommerce RSS. Dates live in product titles. */
async function scrapeLabMonkey(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()

  const now = new Date()
  const events = []

  for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = decodeXml(stripCdata(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')).trim()
    const url = decodeXml(stripCdata(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '')).trim()
    if (!title || !url) continue

    // Date is embedded in the product title: "Prerelease Ticket - Zondag 21-06- 11:00 - …"
    // Pattern captures DD-MM and HH:MM, with an optional trailing dash before the time.
    const m = title.match(/(\d{1,2})-(\d{2})-?\s*(\d{1,2}):(\d{2})/)
    if (!m) continue

    const day = parseInt(m[1]), month = parseInt(m[2])
    const hour = parseInt(m[3]), min = m[4]
    if (month < 1 || month > 12 || day < 1 || day > 31) continue

    // Infer year: use next year if the date is already in the past.
    let year = now.getFullYear()
    if (new Date(year, month - 1, day) < now) year++

    const pad = (n) => String(n).padStart(2, '0')
    const tz = (month >= 4 && month <= 9) ? '+02:00' : '+01:00'
    const start = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${min}:00${tz}`

    const slug = url.split('/').filter(Boolean).pop() ?? url
    events.push({
      id: `labmonkey-${slug}`,
      title,
      start,
      end: addHours(start, 4),
      location: 'Lab Monkey, Lange Viestraat 2B, Utrecht',
      description: '',
      url,
      tags: ['Magic'],
    })
  }

  return events
}

/** Casual Carnage (Warhammer/tabletop in Utrecht): WP REST API.
 *  Date comes from the event title ("Casual Carnage: August 8th");
 *  start time from content ("First game start: HH.MM"). */
async function scrapeCasualCarnage(venue) {
  const res = await fetch(`${venue.feedUrl}?per_page=20&status=publish`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const items = await res.json()
  if (!Array.isArray(items)) throw new Error('Unexpected response format')

  const now = new Date()
  const events = []

  for (const item of items) {
    const title = stripHtml(item.title?.rendered ?? '').trim()
    const url = item.link ?? ''
    if (!title || !url) continue

    // Date in title: "Casual Carnage: August 8th"
    const dm = title.match(/:\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i)
    if (!dm) continue

    const month = EN_MONTHS[dm[1].toLowerCase()]
    if (!month) continue
    const day = parseInt(dm[2])

    // Infer year: use next year if the month/day is already past.
    let year = now.getFullYear()
    if (new Date(year, month - 1, day) < now) year++

    const content = item.content?.rendered ?? ''
    // Start time from content: "First game start: 11.15" (uses dots)
    const tm = content.match(/First game start[^:]*:\s*(\d{1,2})[.:](\d{2})/i)
    const sh = tm ? parseInt(tm[1]) : 11
    const sm = tm ? tm[2] : '00'

    const pad = (n) => String(n).padStart(2, '0')
    const tz = (month >= 4 && month <= 9) ? '+02:00' : '+01:00'
    const start = `${year}-${pad(month)}-${pad(day)}T${pad(sh)}:${sm}:00${tz}`

    events.push({
      id: `casualcarnage-${item.id}`,
      title,
      start,
      end: addHours(start, 9),
      location: 'Silver Heron Studios, Utrecht',
      description: '',
      url,
      tags: ['Warhammer'],
    })
  }

  return events
}

/** Generic scraper for sites running The Events Calendar plugin (tribe/events/v1/events REST API). */
function formatTribeDate(d) {
  const mo = String(d.month).padStart(2, '0')
  const dy = String(d.day).padStart(2, '0')
  const h  = String(d.hour).padStart(2, '0')
  const mi = String(d.minutes).padStart(2, '0')
  const tz = parseInt(d.month) >= 4 && parseInt(d.month) <= 9 ? '+02:00' : '+01:00'
  return `${d.year}-${mo}-${dy}T${h}:${mi}:00${tz}`
}

async function scrapeTribe(venue) {
  const today = new Date().toISOString().slice(0, 10)
  const res = await fetch(`${venue.feedUrl}?per_page=50&start_date=${today}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data.events)) throw new Error('Unexpected response — no events array')

  return data.events.map((event) => {
    const start = event.start_date_details
      ? formatTribeDate(event.start_date_details)
      : event.start_date.replace(' ', 'T') + '+01:00'
    const end = event.end_date_details
      ? formatTribeDate(event.end_date_details)
      : event.end_date
        ? event.end_date.replace(' ', 'T') + '+01:00'
        : addHours(start, 3)
    const loc = event.venue?.venue
      ? [event.venue.venue, event.venue.city].filter(Boolean).join(', ')
      : venue.name
    return {
      id: `${venue.id}-${event.id}`,
      title: decodeXml(stripHtml(event.title ?? '')).trim(),
      start,
      end,
      location: loc,
      description: truncate(stripHtml(event.description ?? '')),
      url: event.url ?? venue.feedUrl,
      tags: (event.categories ?? []).map((c) => c.name).filter(Boolean),
    }
  })
}

function parseIcalDatetime(dtStr) {
  // Handles both "20260617T200000" (Amsterdam assumed) and "20260617T180000Z" (UTC).
  if (dtStr.endsWith('Z')) {
    const utc = new Date(dtStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'))
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(utc)
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '00'
    const tz = parseInt(get('month')) >= 4 && parseInt(get('month')) <= 9 ? '+02:00' : '+01:00'
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}${tz}`
  }
  const y = dtStr.slice(0, 4), mo = dtStr.slice(4, 6), d = dtStr.slice(6, 8)
  const h = dtStr.slice(9, 11), mi = dtStr.slice(11, 13), s = dtStr.slice(13, 15)
  const tz = (parseInt(mo) >= 4 && parseInt(mo) <= 9) ? '+02:00' : '+01:00'
  return `${y}-${mo}-${d}T${h}:${mi}:${s}${tz}`
}

function unfoldIcal(text) {
  return text.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n')
}

function unescapeIcal(val) {
  return val.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, '\n').replace(/\\\\/g, '\\').trim()
}

/** Generic iCal scraper for The Events Calendar feeds (?ical=1). Source-prefixed ids. */
async function scrapeIcal(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const raw = unfoldIcal(await res.text())

  const events = []
  for (const [, block] of raw.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)) {
    const get = (key) => {
      const m = block.match(new RegExp(`^${key}[;:][^\n]*:([^\n]+)`, 'm'))
        ?? block.match(new RegExp(`^${key}:([^\n]+)`, 'm'))
      return m ? unescapeIcal(m[1]) : ''
    }

    let dtstart = block.match(/^DTSTART[^:]*:(\S+)/m)?.[1] ?? ''
    let dtend = block.match(/^DTEND[^:]*:(\S+)/m)?.[1] ?? ''
    const uid = get('UID')
    const summary = get('SUMMARY')
    if (!dtstart || !summary) continue
    // Handle all-day (DATE-only) values that lack a time component.
    if (!dtstart.includes('T')) dtstart += 'T000000'
    if (dtend && !dtend.includes('T')) dtend += 'T000000'

    const url = get('URL')
    const cats = get('CATEGORIES')
    events.push({
      id: `${venue.id}-${(uid.split('@')[0] || uid).slice(0, 48)}`,
      title: summary,
      start: parseIcalDatetime(dtstart),
      end: dtend ? parseIcalDatetime(dtend) : addHours(parseIcalDatetime(dtstart), 3),
      location: get('LOCATION') || `${venue.name}, Utrecht`,
      description: truncate(get('DESCRIPTION')),
      url: url.startsWith('//') ? `https:${url}` : url || venue.feedUrl,
      tags: cats ? cats.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
  }

  return events
}

async function scrapeDbsIcal(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const raw = unfoldIcal(await res.text())

  const events = []
  for (const [, block] of raw.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)) {
    const get = (key) => {
      const m = block.match(new RegExp(`^${key}[;:][^\n]*:([^\n]+)`, 'm'))
        ?? block.match(new RegExp(`^${key}:([^\n]+)`, 'm'))
      return m ? unescapeIcal(m[1]) : ''
    }

    const dtstart = block.match(/^DTSTART[^:]*:(\S+)/m)?.[1] ?? ''
    const dtend   = block.match(/^DTEND[^:]*:(\S+)/m)?.[1] ?? ''
    const url     = get('URL')
    const uid     = get('UID')
    const summary = get('SUMMARY')
    const desc    = get('DESCRIPTION')
    const loc     = get('LOCATION')
    const cats    = get('CATEGORIES')

    if (!dtstart || !summary) continue

    events.push({
      id: uid.split('-')[0] || uid,
      title: summary,
      start: parseIcalDatetime(dtstart),
      end: dtend ? parseIcalDatetime(dtend) : addHours(parseIcalDatetime(dtstart), 3),
      location: loc || "dB's, Vlampijpstraat 63, Utrecht",
      description: truncate(desc),
      url: url.startsWith('//') ? `https:${url}` : (url || venue.feedUrl),
      tags: cats ? cats.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
  }

  return events
}

function parseHellingDatetime(str) {
  // "2026-06-16 19:00:00" — no timezone, assume Amsterdam
  const [date, time] = str.split(' ')
  const month = parseInt(date.split('-')[1])
  const tz = (month >= 4 && month <= 9) ? '+02:00' : '+01:00'
  return `${date}T${time}${tz}`
}

async function scrapeHelling(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const events = []
  for (const [, block] of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data
    try { data = JSON.parse(block.trim()) } catch { continue }
    if (data['@type'] !== 'Event') continue

    const url = data.url ?? ''
    const slug = url.split('/').filter(Boolean).pop() ?? ''

    events.push({
      id: `helling-${slug}`,
      title: decodeXml(data.name ?? ''),
      start: parseHellingDatetime(data.startDate),
      end: data.endDate ? parseHellingDatetime(data.endDate) : addHours(parseHellingDatetime(data.startDate), 3),
      location: 'De Helling, Helling 7, Utrecht',
      description: truncate(decodeXml(data.description ?? '')),
      url,
      tags: [],
    })
  }

  return events
}

async function scrapeBeton(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const events = []
  for (const [, url, block] of html.matchAll(/<a[^>]*href="(https:\/\/www\.vechtclub\.nl\/agenda\/[^"]+)"[^>]*class="event"[^>]*>([\s\S]*?)<\/a>/g)) {
    const titleMatch = block.match(/class="event__text-title">([^<]+)</)
    const dateMatch = block.match(/class="tags__date">\s*\n?\s*([^\n<]+)\n?\s*</)
    const tags = [...block.matchAll(/class="button button--tag[^"]*">([^<]+)</g)]
      .map(m => m[1].trim())
      .filter(t => t !== 'Beton-T')

    if (!titleMatch || !dateMatch) continue

    const start = parseDutchDate(dateMatch[1])
    if (!start) continue

    const slug = url.split('/').filter(Boolean).pop()
    const title = decodeXml(titleMatch[1].trim())

    events.push({
      id: `beton-${slug}`,
      title,
      start,
      end: start,
      location: 'Beton-T, Atoomweg 100, Utrecht',
      description: '',
      url,
      tags,
    })
  }

  return events
}

async function scrapeAcu(venue) {
  // ACU runs WordPress + The Events Calendar, which exposes a stable RSS feed.
  // The event date lives in the permalink (/events/YYYYMMDD/slug); the time is
  // not a machine-readable field, so we read it from the text when present and
  // otherwise fall back to a date-only event (the UI hides the time then).
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()

  const events = []
  for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const url = decodeXml(stripCdata(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '')).trim()
    const dateStr = url.match(/\/events\/(\d{8})\//)?.[1]
    if (!dateStr) continue

    const title = decodeXml(stripCdata(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')).trim()
    if (!title) continue

    const desc = truncate(stripHtml(decodeXml(stripCdata(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''))))

    const y = dateStr.slice(0, 4), mo = dateStr.slice(4, 6), d = dateStr.slice(6, 8)
    const tz = (parseInt(mo) >= 4 && parseInt(mo) <= 9) ? '+02:00' : '+01:00'

    const timeMatch = desc.match(/@\s*(\d{1,2})[.:](\d{2})/) ?? desc.match(/\b(\d{1,2})[.:](\d{2})\s*(?:uur|u\b)/)
    const start = timeMatch
      ? `${y}-${mo}-${d}T${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}:00${tz}`
      : `${y}-${mo}-${d}T00:00:00${tz}`

    events.push({
      id: `acu-${dateStr}-${url.split('/').filter(Boolean).pop()}`,
      title,
      start,
      end: start,
      location: 'ACU, Voorstraat 71, Utrecht',
      description: desc,
      url,
      tags: [],
    })
  }

  return events
}

/** Parse a Dutch "DD/MM/YYYY HH:MM - HH:MM" date out of free text (Strand Oog in Al). */
function parseSoiaDate(text) {
  const m = text.match(/(\d{2})\/(\d{2})\/(\d{4})(?:[^\d]{0,4}(\d{1,2}):(\d{2})(?:\s*[-–]\s*(\d{1,2}):(\d{2}))?)?/)
  if (!m) return null
  const [, d, mo, y, sh0, sm0, eh, em] = m
  if (parseInt(mo) < 1 || parseInt(mo) > 12) return null
  const sh = sh0 ? sh0.padStart(2, '0') : '00'
  const sm = sm0 ?? '00'
  const tz = parseInt(mo) >= 4 && parseInt(mo) <= 10 ? '+02:00' : '+01:00'
  const start = `${y}-${mo}-${d}T${sh}:${sm}:00${tz}`
  let end
  if (eh) {
    let dur = (parseInt(eh) * 60 + parseInt(em)) - (parseInt(sh) * 60 + parseInt(sm))
    if (dur <= 0) dur += 1440
    end = addHours(start, dur / 60)
  } else {
    end = addHours(start, 4)
  }
  return { start, end }
}

/** Scrape Strand Oog in Al's WordPress RSS; event dates live as prose in the content. */
async function scrapeSoia(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()

  const events = []
  for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = decodeXml(stripCdata(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')).trim()
    const url = decodeXml(stripCdata(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '')).trim()
    const rawContent =
      item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/)?.[1] ??
      item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ??
      ''
    const text = stripHtml(decodeXml(stripCdata(rawContent)))

    const when = parseSoiaDate(text)
    // Skip undated / recurring entries (no machine-placeable date).
    if (!title || !url || !when) continue

    const slug = url.split('/').filter(Boolean).pop()
    const desc = text.replace(/^Home\s*>\s*agenda\s*/i, '').trim()
    events.push({
      id: `soia-${slug}`,
      title,
      start: when.start,
      end: when.end,
      location: 'Strand Oog in Al, Hof van Transwijk, Utrecht',
      description: truncate(desc || text),
      url,
      tags: [],
    })
  }

  return events
}

/** Parse a worldofbuhurt date string like "10-12 July 2026" or "23 July 2026". */
function parseWobDate(text) {
  const m = text.match(/(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?\s+([A-Za-z]+)\s+(\d{4})/)
  if (!m) return null
  const mon = EN_MONTHS[m[3].toLowerCase()]
  if (!mon) return null
  const pad = (n) => String(n).padStart(2, '0')
  const y = m[4]
  const d1 = parseInt(m[1])
  const d2 = m[2] ? parseInt(m[2]) : d1
  const tz = mon >= 4 && mon <= 10 ? '+02:00' : '+01:00'
  return {
    start: `${y}-${pad(mon)}-${pad(d1)}T00:00:00${tz}`,
    end: `${y}-${pad(mon)}-${pad(d2)}T23:00:00${tz}`,
  }
}

/** Extract WOB events from one page of HTML. Mutates seen + events in place. */
function extractWobEventsFromHtml(html, seen, events) {
  const re = /<a href="(https:\/\/www\.worldofbuhurt\.com\/tournaments\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g
  for (const [, url, block] of html.matchAll(re)) {
    if (seen.has(url)) continue
    seen.add(url)

    const title = decodeXml(
      (block.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? block.match(/alt="([^"]+)"/)?.[1] ?? '').trim(),
    )
    const locRaw = block.match(/tournament-small-location[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ''
    const locText = stripHtml(decodeXml(locRaw))
      .replace(/^Location:\s*/i, '')
      .replace(/[^ -ɏ,]/g, '')
      .trim()
    const dateText = stripHtml(block.match(/<p>Date:\s*([\s\S]*?)<\/p>/)?.[1] ?? '').trim()

    if (!title || !locText || !dateText) continue

    const country = locText.split(',').pop().trim()
    if (!EUROPEAN_COUNTRIES.has(country)) continue

    const when = parseWobDate(dateText)
    if (!when) continue

    const catRaw = block.match(/<p>Category:\s*([\s\S]*?)<\/p>/)?.[1]
    const tags = catRaw ? stripHtml(catRaw).split(',').map((t) => t.trim()).filter(Boolean) : []

    const slug = url.split('/').filter(Boolean).pop()
    events.push({
      id: `wob-${slug}`,
      title,
      start: when.start,
      end: when.end,
      location: locText,
      country,
      description: `Buhurt-toernooi in ${country}. ${dateText}.`,
      url,
      tags,
    })
  }
}

/** Scrape worldofbuhurt's tournament list (SSR HTML), Europe only. Handles pagination. */
async function scrapeWob(venue) {
  const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' }
  const events = []
  const seen = new Set()

  for (let page = 1; page <= 10; page++) {
    const url = page === 1 ? venue.feedUrl : `${venue.feedUrl}/page:${page}`
    const res = await fetch(url, { headers: UA })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    extractWobEventsFromHtml(html, seen, events)

    if (!html.includes(`/tournaments/page:${page + 1}`)) break
  }

  return events
}

/** Fetch a single buhurtinternational.com tournament page and return a structured event, or null. */
async function fetchBiPage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' } })
    if (!res.ok) return null
    const html = await res.text()

    // Wix template: 1st 40px span = tournament name, 2nd 40px span = host country.
    const spans40 = [...html.matchAll(/font-size:40px[^>]*>(?:<[^>]*>)*([^<]+)<\/span/g)]
      .map((m) => m[1].trim()).filter(Boolean)
    const country = spans40[1] ?? ''
    if (!EUROPEAN_COUNTRIES.has(country)) return null

    // First EN date in a 22px h2 = tournament start date (registration deadlines follow).
    const dateRaw = html.match(
      /font-size:22px[^>]*>[\s\S]{0,400}?((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/
    )?.[1]
    if (!dateRaw) return null
    const dm = dateRaw.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/)
    if (!dm) return null
    const month = EN_MONTHS[dm[1].toLowerCase()]
    if (!month) return null

    const day  = parseInt(dm[2])
    const year = dm[3]
    const name = spans40[0] ?? html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() ?? 'Buhurt Tournament'
    const slug = url.split('/tournament/').pop()
    const pad  = (n) => String(n).padStart(2, '0')
    const tz   = month >= 4 && month <= 9 ? '+02:00' : '+01:00'

    return {
      id: `bi-${slug}`,
      title: name,
      start: `${year}-${pad(month)}-${pad(day)}T00:00:00${tz}`,
      end:   `${year}-${pad(month)}-${pad(day)}T23:00:00${tz}`,
      location: country,
      country,
      description: `Buhurt-toernooi in ${country}.`,
      url,
      tags: [],
    }
  } catch {
    return null
  }
}

/** Scrape buhurtinternational.com via tournament sitemap + individual pages (Wix site, no public API).
 *  Filters to recently-modified entries, batch-fetches pages, keeps European future events. */
async function scrapeBuhurtInternational(venue) {
  const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' }
  const SITEMAP = 'https://www.buhurtinternational.com/dynamic-tournament_p_6c8bf2fe_955a_4c5d_96da_cca47bae6c0e_0_5000-sitemap.xml'

  const sitemapRes = await fetch(SITEMAP, { headers: UA })
  if (!sitemapRes.ok) throw new Error(`BI sitemap HTTP ${sitemapRes.status}`)
  const xml = await sitemapRes.text()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const urls = []
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc     = block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? ''
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? ''
    if (lastmod >= cutoffStr && loc.includes('/tournament/')) urls.push(decodeURIComponent(loc))
  }
  process.stdout.write(`(${urls.length} candidates) `)

  const BATCH = 8
  const events = []
  for (let i = 0; i < urls.length; i += BATCH) {
    const results = await Promise.all(urls.slice(i, i + BATCH).map(fetchBiPage))
    events.push(...results.filter(Boolean))
  }

  return events
}
/** Heroes Dutch Comic Con: JSON-LD Festival schema on the homepage. */
async function scrapeDcc(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  for (const [, block] of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data
    try { data = JSON.parse(block.trim()) } catch { continue }
    if (data['@type'] !== 'Festival') continue
    if (!data.startDate) continue

    const fixTz = (s) => {
      // "+2:00" → "+02:00" (single-digit hour offset in the wild)
      s = s.replace(/([+-])(\d):(\d{2})$/, (_, sign, h, m) => `${sign}0${h}:${m}`)
      // Add Amsterdam TZ if no offset present at all
      if (!s.includes('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
        const mo = parseInt(s.slice(5, 7))
        s += mo >= 4 && mo <= 9 ? '+02:00' : '+01:00'
      }
      return s
    }

    const start = fixTz(data.startDate)
    const end   = data.endDate ? fixTz(data.endDate) : addHours(start, 32)

    const loc = data.location?.name
      ? [data.location.name, data.location.address].filter(Boolean).join(', ')
      : 'Jaarbeurs Utrecht'

    const dateTag = data.startDate.slice(0, 10).replace(/-/g, '')
    return [{
      id: `dcc-${dateTag}`,
      title: data.name ?? 'Heroes Dutch Comic Con',
      start,
      end,
      location: loc,
      description: truncate(data.description ?? ''),
      url: data.url ?? venue.feedUrl,
      tags: ['Comic Con', 'Pop Culture'],
    }]
  }

  return []
}

/** Spellenspektakel (board game fair, Jaarbeurs Utrecht): hardcoded — site blocks all HTTP scrapers (Cloudflare 403). Update annually. */
async function scrapeSpellenspektakel(venue) {
  return [
    {
      id: 'spellenspektakel-2026',
      title: 'Spellenspektakel 2026',
      start: '2026-11-07T10:00:00+01:00',
      end:   '2026-11-08T18:00:00+01:00',
      location: 'Jaarbeurs Utrecht',
      description: 'Grootste bordspellenbeurs van Nederland.',
      url: venue.feedUrl,
      tags: ['Bordspellen'],
    },
  ]
}

/** Abunai! (anime convention, Veldhoven): date parsed from homepage H1 text. */
async function scrapeAbunai(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  // "7, 8 &amp; 9 August 2026" (days-first Dutch layout, month name in English)
  const m = html.match(/(\d{1,2}),\s*\d+\s*(?:&amp;|&)\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (!m) return []

  const startDay = parseInt(m[1])
  const endDay   = parseInt(m[2])
  const month    = EN_MONTHS[m[3].toLowerCase()]
  const year     = m[4]
  if (!month) return []

  const pad = (n) => String(n).padStart(2, '0')
  const tz  = month >= 4 && month <= 9 ? '+02:00' : '+01:00'

  return [{
    id: `abunai-${year}`,
    title: `Abunai! ${year}`,
    start: `${year}-${pad(month)}-${pad(startDay)}T10:00:00${tz}`,
    end:   `${year}-${pad(month)}-${pad(endDay)}T22:00:00${tz}`,
    location: 'NH Koningshof, Veldhoven',
    description: 'Japanse anime- en mangaconventie in Veldhoven.',
    url: venue.feedUrl,
    tags: ['Anime', 'Manga'],
  }]
}

/** AnimeCon (anime convention, Netherlands): date from homepage text. */
async function scrapeAnimecon(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  // "AnimeCon 2027 will start on April 16th at 14:00 CEST"
  const startM = html.match(/AnimeCon\s+(\d{4})\s+will\s+start\s+on\s+([A-Za-z]+)\s+(\d{1,2})/)
  if (!startM) return []

  const year     = startM[1]
  const month    = EN_MONTHS[startM[2].toLowerCase()]
  const startDay = parseInt(startM[3])
  if (!month) return []

  // Look for end-day in a range pattern like "April 16 – 18" or "April 17-19"
  const rangeM = html.match(/([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2})/)
  const endDay = rangeM && EN_MONTHS[rangeM[1].toLowerCase()] === month
    ? parseInt(rangeM[3])
    : startDay + 2

  const pad = (n) => String(n).padStart(2, '0')
  const tz  = month >= 4 && month <= 9 ? '+02:00' : '+01:00'

  return [{
    id: `animecon-${year}`,
    title: `AnimeCon ${year}`,
    start: `${year}-${pad(month)}-${pad(startDay)}T14:00:00${tz}`,
    end:   `${year}-${pad(month)}-${pad(endDay)}T18:00:00${tz}`,
    location: 'De Broodfabriek Expo, Rijswijk',
    description: 'De grootste anime-conventie van Nederland.',
    url: venue.feedUrl,
    tags: ['Anime', 'Manga'],
  }]
}

/** EKKO Utrecht — WordPress REST API with ACF event fields. */
async function scrapeEkkoWp(venue) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  const events = []
  const seenSlugs = new Set()

  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://ekko.nl/wp-json/wp/v2/event?per_page=100&_fields=id,slug,title,link,acf,content&orderby=modified&order=desc&page=${page}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' } },
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!data.length) break

    let foundFuture = 0
    for (const e of data) {
      if (e.link.includes('/en/event/')) continue  // skip English duplicates
      const slug = e.slug ?? String(e.id)
      if (seenSlugs.has(slug)) continue
      seenSlugs.add(slug)

      const dateTime = e.acf?.date_time
      if (!dateTime || dateTime.slice(0, 10) < todayStr) continue
      foundFuture++

      const dt = dateTime.replace(' ', 'T')
      const month = parseInt(dateTime.slice(5, 7))
      const tz = (month >= 4 && month <= 9) ? '+02:00' : '+01:00'
      const start = dt + tz

      const endDateTime = e.acf?.date_time_end
      const end = endDateTime
        ? endDateTime.replace(' ', 'T') + ((parseInt(endDateTime.slice(5, 7)) >= 4 && parseInt(endDateTime.slice(5, 7)) <= 9) ? '+02:00' : '+01:00')
        : addHours(start, 3)

      events.push({
        id: String(e.id),
        title: decodeXml(e.title?.rendered ?? ''),
        start,
        end,
        location: 'EKKO, Bemuurde Weerd OZ 3, Utrecht',
        description: truncate(stripHtml(e.content?.rendered ?? e.acf?.one_liner ?? '')),
        url: e.link,
        tags: [],
      })
    }

    if (foundFuture === 0) break
  }

  return events
}

/** Polderslot / SCA — filter Dutch events from the Drachenwald kingdom calendar. */
async function scrapeDrachenwaldSca(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const pad = n => String(n).padStart(2, '0')

  return data
    .filter(e => {
      const country = (e['country'] ?? '').trim().toLowerCase()
      const branch  = (e['host-branch'] ?? '').trim().toLowerCase()
      const isNl    = country.includes('netherlands') || country.includes('nederland') || branch.includes('polderslot')
      const isFuture    = (e['start-date'] ?? '') >= todayStr
      const notCancelled = !(e['status'] ?? '').toLowerCase().includes('cancel')
      const notInfo      = (e['type'] ?? '') !== 'other'
      return isNl && isFuture && notCancelled && notInfo
    })
    .map(e => {
      const start  = e['start-date']
      const end    = e['end-date'] || start
      const month  = parseInt(start.slice(5, 7))
      const tz     = month >= 4 && month <= 9 ? '+02:00' : '+01:00'
      const slug   = e['slug'] ?? ''
      const location = [e['town'], e['site-address']].filter(Boolean).join(', ') || 'Nederland'
      const url    = e['website'] || (slug ? `https://polderslot.info/agenda/#/${slug}` : venue.feedUrl)
      return {
        id:          `sca-${slug || start + '-' + (e['event-name'] ?? '').replace(/\s+/g, '-').toLowerCase()}`,
        title:       e['event-name'] ?? '',
        start:       `${start}T12:00:00${tz}`,
        end:         `${end}T23:00:00${tz}`,
        location,
        description: truncate(stripHtml(e['summary'] ?? '')),
        url,
        tags:        [],
      }
    })
}

/** Castlefest (medieval/fantasy festival, Kasteel Keukenhof, Lisse): hardcoded — site blocks scrapers. Update annually. */
async function scrapeCastlefest(venue) {
  return [{
    id:          'castlefest-2026',
    title:       'Castlefest 2026',
    start:       '2026-07-30T11:00:00+02:00',
    end:         '2026-08-02T23:00:00+02:00',
    location:    'Kasteel Keukenhof, Lisse',
    description: 'Vier dagen fantasy, middeleeuwen en live muziek bij Kasteel Keukenhof.',
    url:         venue.feedUrl,
    tags:        [],
  }]
}

/** Parse Elfia date strings like "19th and 20th September 2026" or "8th, 9th, 10th May 2026". */
function parseElfiaDate(str) {
  // "19th and 20th September 2026"
  let m = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+and\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/i)
  if (m) {
    const month = EN_MONTHS[m[3].toLowerCase()]
    if (month) return { year: parseInt(m[4]), month, startDay: parseInt(m[1]), endDay: parseInt(m[2]) }
  }
  // "8th, 9th, 10th May 2026" — take first and last day number
  m = str.match(/(\d{1,2})(?:st|nd|rd|th)?(?:[^0-9]+\d{1,2}(?:st|nd|rd|th)?)+[^0-9]+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/i)
  if (m) {
    const month = EN_MONTHS[m[3].toLowerCase()]
    if (month) return { year: parseInt(m[4]), month, startDay: parseInt(m[1]), endDay: parseInt(m[2]) }
  }
  // "20 - 21 September 2025"
  m = str.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i)
  if (m) {
    const month = EN_MONTHS[m[3].toLowerCase()]
    if (month) return { year: parseInt(m[4]), month, startDay: parseInt(m[1]), endDay: parseInt(m[2]) }
  }
  return null
}

/** Elfia (fantasy fair) — parses upcoming editions from the versioned landmark-page.js. */
async function scrapeElfia(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const jsM = html.match(/src="([^"]*landmark-page\.js[^"]*)"/)
  if (!jsM) return []
  const jsUrl = new URL(jsM[1].replace(/^\.\//, ''), venue.feedUrl).href

  const jsRes = await fetch(jsUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!jsRes.ok) throw new Error(`HTTP ${jsRes.status}`)
  const js = await jsRes.text()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const pad = n => String(n).padStart(2, '0')
  const seen = new Set()
  const events = []

  for (const [, title, date] of js.matchAll(/title:\s*'([^']+)'[\s\S]{0,1200}?date:\s*'([^']+)'/g)) {
    const key = title + '|' + date
    if (seen.has(key)) continue
    seen.add(key)

    const parsed = parseElfiaDate(date)
    if (!parsed) continue

    const { year, month, startDay, endDay } = parsed
    const startStr = `${year}-${pad(month)}-${pad(startDay)}`
    if (startStr < todayStr) continue

    const tz = month >= 4 && month <= 9 ? '+02:00' : '+01:00'
    const cleanTitle = title.replace(/\s*Castle\s+|\s*Gardens?\s*/gi, ' ').trim()
    events.push({
      id:          `elfia-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${year}`,
      title:       `Elfia ${cleanTitle} ${year}`,
      start:       `${startStr}T10:00:00${tz}`,
      end:         `${year}-${pad(month)}-${pad(endDay)}T22:00:00${tz}`,
      location:    `${title}, Nederland`,
      description: `Outdoor fantasy fair bij ${title}.`,
      url:         venue.feedUrl,
      tags:        [],
    })
  }

  return events
}

/** Archeon (historical theme park, Alphen a/d Rijn) — reads special-event WP pages by slug. */
async function scrapeArcheon(venue) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const pad = n => String(n).padStart(2, '0')

  const eventPages = [
    { slug: 'midzomerfair',  label: 'Midzomer Fair' },
    { slug: 'midwinterfair', label: 'Midwinter Fair' },
  ]

  const events = []
  for (const { slug, label } of eventPages) {
    const res = await fetch(
      `https://archeon.eu/wp-json/wp/v2/pages?slug=${slug}&_fields=title,content,link`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' } },
    )
    if (!res.ok) continue
    const pages = await res.json()
    if (!pages.length) continue

    const content = pages[0].content?.rendered ?? ''
    // "4 &#038; 5 juli 2026"  or  "12 &amp; 13 december 2026"
    const m = content.match(/(\d{1,2})\s*(?:&#0*38;|&amp;|&)\s*(\d{1,2})\s+([a-zéëïáó]+)\s+(\d{4})/i)
    if (!m) continue

    const startDay = parseInt(m[1])
    const endDay   = parseInt(m[2])
    const month    = NL_MONTHS[m[3].toLowerCase().slice(0, 3)]
    const year     = m[4]
    if (!month) continue

    const startStr = `${year}-${pad(month)}-${pad(startDay)}`
    if (startStr < todayStr) continue

    const tz = month >= 4 && month <= 9 ? '+02:00' : '+01:00'
    events.push({
      id:          `archeon-${slug}-${year}`,
      title:       `Archeon ${label} ${year}`,
      start:       `${startStr}T11:00:00${tz}`,
      end:         `${year}-${pad(month)}-${pad(endDay)}T23:00:00${tz}`,
      location:    'Archeon Museumpark, Alphen aan den Rijn',
      description: truncate(stripHtml(content).slice(0, 400)),
      url:         pages[0].link ?? venue.feedUrl,
      tags:        [],
    })
  }

  return events
}

/** KommuS Kasteelfestival (Geldrop): hardcoded — site has no scrape-friendly API. Update annually. */
async function scrapeKommusKasteelfestival(venue) {
  return [{
    id:          'kommus-kasteelfestival-2026',
    title:       'KommuS Kasteelfestival 2026',
    start:       '2026-07-04T13:00:00+02:00',
    end:         '2026-07-05T23:30:00+02:00',
    location:    'Kasteeltuin, Geldrop',
    description: 'Jubileumeditie (10e keer) van het jaarlijkse kasteelfestival in de tuin van Kasteel Geldrop.',
    url:         venue.feedUrl,
    tags:        [],
  }]
}

/** Resolve a Dutch month word (full or abbreviated) to a 1-12 number. */
function nlMonth(str) {
  const full = { maart: 3, februari: 2, augustus: 8, september: 9, oktober: 10, november: 11, december: 12 }
  const s = str.toLowerCase()
  return full[s] ?? NL_MONTHS[s.slice(0, 3)] ?? null
}

/**
 * Parse a Dutch date string (without year) into { startDay, startMonth, endDay, endMonth }.
 * Handles: "8 juni t/m 30 augustus", "4 t/m 26 juli", "26 juni", "13, 14 en 15 juli".
 */
function parseDutchDateRange(str) {
  const s = str.trim().toLowerCase().replace(/&amp;/g, '&').replace(/&#[0-9]+;/g, ' ')

  // "8 juni t/m 30 augustus" (cross-month)
  const MONTH_WORD = 'jan(?:uari)?|feb(?:ruari)?|maart|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|aug(?:ustus)?|sep(?:tember)?|okt(?:ober)?|nov(?:ember)?|dec(?:ember)?'
  let m = s.match(new RegExp(`(\\d{1,2})\\s+(${MONTH_WORD})\\s+t\\/m\\s+(\\d{1,2})\\s+(${MONTH_WORD})`))
  if (m) {
    const sm = nlMonth(m[2]), em = nlMonth(m[4])
    if (sm && em) return { startDay: +m[1], startMonth: sm, endDay: +m[3], endMonth: em }
  }

  // Find the month name, then collect all day-numbers that appear before it
  const monM = s.match(/\b(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\b/)
  if (!monM) return null
  const mon = nlMonth(monM[1])
  if (!mon) return null

  // "4 t/m 26 juli" or "13, 14 en 15 juli" — grab all 1-2 digit numbers before the month name
  const before = s.slice(0, monM.index)
  const nums = [...before.matchAll(/\b(\d{1,2})\b/g)].map(n => +n[1]).filter(n => n >= 1 && n <= 31)
  if (!nums.length) return null

  return { startDay: nums[0], startMonth: mon, endDay: nums[nums.length - 1], endMonth: mon }
}

/**
 * Return year for a given month/day.
 * - If the date is in the future this year → current year.
 * - If the date just passed (< 60 days ago) → current year (will be filtered as past).
 * - If the date is clearly past (≥ 60 days ago) → next year (website lists recurring events early).
 */
function inferYear(month, day) {
  const now = new Date()
  const y = now.getFullYear()
  const thisYear = new Date(y, month - 1, day)
  return now - thisYear > 60 * 24 * 60 * 60 * 1000 ? y + 1 : y
}

/** Muiderslot (medieval castle, Muiden): agenda page with Dutch date strings. */
async function scrapeMuiderslot(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const pad = n => String(n).padStart(2, '0')
  const events = []
  const seen = new Set()

  // Each event card: <a href=".../activiteit/..." title="..."><img>...<div>date</div>...<h3>title</h3>...</a>
  for (const [, url, titleAttr, inner] of html.matchAll(
    /<a\s[^>]*href="(https?:\/\/muiderslot\.nl\/activiteit\/[^"]+)"[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g,
  )) {
    if (seen.has(url)) continue
    seen.add(url)

    // Date is in the first <div> inside the card
    const dateM = inner.match(/<div[^>]*>([^<]+)<\/div>/)
    if (!dateM) continue
    const dateStr = dateM[1].trim()

    const parsed = parseDutchDateRange(dateStr)
    if (!parsed) continue

    const { startDay, startMonth, endDay, endMonth } = parsed
    const year = inferYear(startMonth, startDay)
    const startStr = `${year}-${pad(startMonth)}-${pad(startDay)}`
    if (startStr < todayStr) continue

    const endYear = endMonth < startMonth ? year + 1 : year
    const tz = startMonth >= 4 && startMonth <= 9 ? '+02:00' : '+01:00'
    const slug = url.replace(/.*\/activiteit\//, '').replace(/\/$/, '')

    events.push({
      id:          `muiderslot-${slug}-${year}`,
      title:       stripHtml(titleAttr).trim() || 'Muiderslot activiteit',
      start:       `${startStr}T10:00:00${tz}`,
      end:         `${endYear}-${pad(endMonth)}-${pad(endDay)}T18:00:00${tz}`,
      location:    'Muiderslot, Muiden',
      description: '',
      url,
      tags:        [],
    })
  }

  return events
}

/** Slot Loevestein (historic fortress, Poederooijen): agenda page with Dutch dates including year. */
async function scrapeSlotLoevestein(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const pad = n => String(n).padStart(2, '0')
  const events = []
  const seen = new Set()

  // Pattern: <h2/h3 class="t-entry-title ..."><a href="URL">title</a></h2/h3> ... <span class="t-entry-date">date</span>
  for (const [, url, rawTitle, dateStr] of html.matchAll(
    /<h[23][^>]*t-entry-title[^>]*>\s*<a\s+href="(https?:\/\/www\.slotloevestein\.nl\/agenda\/[^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h[23]>[\s\S]{0,400}?<span[^>]*t-entry-date[^>]*>([\s\S]*?)<\/span>/g,
  )) {
    if (seen.has(url)) continue
    seen.add(url)

    const title = stripHtml(rawTitle).trim()
    const dateTxt = stripHtml(dateStr).trim()

    // "4 juli 2026 — 30 augustus 2026" or "25 juli 2026 — 26 juli 2026"
    let startStr, endStr, tz
    const rangeM = dateTxt.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})\s*(?:—|–|-+)\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/i)
    if (rangeM) {
      const sm = nlMonth(rangeM[2])
      const em = nlMonth(rangeM[5])
      if (!sm || !em) continue
      startStr = `${rangeM[3]}-${pad(sm)}-${pad(+rangeM[1])}`
      endStr   = `${rangeM[6]}-${pad(em)}-${pad(+rangeM[4])}`
      tz = sm >= 4 && sm <= 9 ? '+02:00' : '+01:00'
    } else {
      // "26 september 2026" — single date
      const singleM = dateTxt.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i)
      if (!singleM) continue
      const mon = nlMonth(singleM[2])
      if (!mon) continue
      startStr = `${singleM[3]}-${pad(mon)}-${pad(+singleM[1])}`
      endStr   = startStr
      tz = mon >= 4 && mon <= 9 ? '+02:00' : '+01:00'
    }

    if (startStr < todayStr) continue
    const slug = url.replace(/.*\/agenda\//, '').replace(/\/$/, '')

    events.push({
      id:          `loevestein-${slug}-${startStr.slice(0, 7)}`,
      title,
      start:       `${startStr}T10:00:00${tz}`,
      end:         `${endStr}T18:00:00${tz}`,
      location:    'Slot Loevestein, Poederooijen',
      description: '',
      url,
      tags:        [],
    })
  }

  return events
}

/** Ruïne van Brederode (Santpoort-Zuid): filter to Ruïne Bewoond + falconry/archery events. */
async function scrapeRuineBrederode(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const pad = n => String(n).padStart(2, '0')
  const KEEP = /ruïne bewoond|bewoond|valkenier|roofvogel|middeleeuw|ridder|boogschiet/i
  // Structure: <p>date</p> ... <h4>title</h4> ... <a href="URL">
  const DAYS = 'maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag'
  const events = []
  const seenIds = new Set()

  for (const [titleTag, titlePos] of [...html.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)].map(m => [m[1], m.index])) {
    const rawTitle = stripHtml(titleTag).replace(/&#0*38;/g, '&').trim()
    if (!rawTitle || !KEEP.test(rawTitle)) continue

    // URL in <a href> within 1000 chars after the <h4>
    const after = html.slice(titlePos, titlePos + 1000)
    const linkM = after.match(/href="(https?:\/\/ruinevanbrederode\.nl\/[^"]+)"/)

    // Strategy 1: date embedded in the title (e.g. "Ruïne Bewoond 11 en 12 juli")
    let startDay, endDay, mon, title
    const titleDateM = rawTitle.match(/\b(\d{1,2})\s+en\s+(\d{1,2})\s+([a-z]+)\b/i)
      ?? rawTitle.match(/\b(\d{1,2})\s*(?:&#0*38;|&)\s*(\d{1,2})\s+([a-z]+)\b/i)
    if (titleDateM) {
      startDay = +titleDateM[1]; endDay = +titleDateM[2]; mon = nlMonth(titleDateM[3])
      // Clean the title: remove the date part
      title = rawTitle.replace(/\s*\d{1,2}\s+en\s+\d{1,2}\s+\S+/i, '').replace(/\s*\d{1,2}\s*(?:&amp;|&)\s*\d{1,2}\s+\S+/i, '').trim()
    } else {
      const titleSingleM = rawTitle.match(/\b(\d{1,2})\s+([a-z]{4,})\b/i)
      if (titleSingleM && nlMonth(titleSingleM[2])) {
        startDay = +titleSingleM[1]; endDay = startDay; mon = nlMonth(titleSingleM[2])
        title = rawTitle.replace(/\s*\d{1,2}\s+[a-z]{4,}/i, '').trim()
      }
    }

    // Strategy 2: date in last <p dayname...> within 600 chars before the <h4>
    if (!mon) {
      title = rawTitle
      const before = html.slice(Math.max(0, titlePos - 600), titlePos)
      const allDatePs = [...before.matchAll(new RegExp(`<p[^>]*>\\s*((?:${DAYS})\\s[^<]{2,50})<\\/p>`, 'gi'))]
      if (!allDatePs.length) continue
      const dateText = allDatePs[allDatePs.length - 1][1].trim()

      const rangeM = dateText.match(new RegExp(`(?:${DAYS})\\s+(\\d{1,2})\\s+en\\s+(?:${DAYS})\\s+(\\d{1,2})\\s+([a-z]+)`, 'i'))
      if (rangeM) {
        startDay = +rangeM[1]; endDay = +rangeM[2]; mon = nlMonth(rangeM[3])
      } else {
        const singleM = dateText.match(new RegExp(`(?:${DAYS})\\s+(\\d{1,2})\\s+([a-z]+)`, 'i'))
        if (!singleM) continue
        startDay = +singleM[1]; endDay = startDay; mon = nlMonth(singleM[2])
      }
    }
    if (!mon || !title) continue

    const year = inferYear(mon, startDay)
    const startStr = `${year}-${pad(mon)}-${pad(startDay)}`
    if (startStr < todayStr) continue

    const tz = mon >= 4 && mon <= 9 ? '+02:00' : '+01:00'
    const id = `brederode-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${year}-${pad(mon)}-${pad(startDay)}`
    if (seenIds.has(id)) continue
    seenIds.add(id)

    events.push({
      id,
      title,
      start:       `${startStr}T11:00:00${tz}`,
      end:         `${year}-${pad(mon)}-${pad(endDay)}T17:00:00${tz}`,
      location:    'Ruïne van Brederode, Santpoort-Zuid',
      description: '',
      url:         linkM ? linkM[1] : venue.feedUrl,
      tags:        [],
    })
  }

  return events
}

/** Kasteel Hoensbroek (Limburg): overview page, extract annual Spectaculair Ridderfestijn date. */
async function scrapeHoensbroek(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const pad = n => String(n).padStart(2, '0')

  // Find the ridderfestijn article: <a href="...spectaculair-ridderfestijn/...">...<h3>...<date>
  const blockM = html.match(/<a\s[^>]*href="([^"]*spectaculair-ridderfestijn[^"]*)"[\s\S]*?Events\s*\|\s*(\d{1,2})\s*(?:&amp;|&|en)\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/i)
  if (!blockM) return []

  const eventUrl = blockM[1]
  const startDay = +blockM[2], endDay = +blockM[3]
  const mon = nlMonth(blockM[4])
  const year = blockM[5]
  if (!mon) return []

  const startStr = `${year}-${pad(mon)}-${pad(startDay)}`
  if (startStr < todayStr) return []

  const tz = mon >= 4 && mon <= 9 ? '+02:00' : '+01:00'
  return [{
    id:          `hoensbroek-ridderfestijn-${year}`,
    title:       `Spectaculair Ridderfestijn Kasteel Hoensbroek ${year}`,
    start:       `${startStr}T10:00:00${tz}`,
    end:         `${year}-${pad(mon)}-${pad(endDay)}T17:00:00${tz}`,
    location:    'Kasteel Hoensbroek, Hoensbroek',
    description: 'Spectaculaire strijd om de Heerlijkheid Hoensbroeck. Ridders te paard op het toernooiveld.',
    url:         eventUrl || venue.feedUrl,
    tags:        ['Riddertoernooi'],
  }]
}

/** Middeleeuws Montfort (annual medieval festival at Kasteel Montfort, Roermond): hardcoded. */
async function scrapeMontfort(venue) {
  return [{
    id:          'montfort-2026',
    title:       'Middeleeuws Montfort 2026',
    start:       '2026-07-18T11:00:00+02:00',
    end:         '2026-07-19T18:00:00+02:00',
    location:    'Kasteel Montfort, Huysdijk 4, Montfort',
    description: 'Het grootste middeleeuwse festijn van Zuid-Nederland. Ridders, jonkvrouwen, ambachtslieden en een grote middeleeuwse markt rondom Kasteel Montfort.',
    url:         venue.feedUrl,
    tags:        ['Festival', 'Middeleeuwen'],
  }]
}

/** Manually curated buhurt club nights (not in any tournament feed). */
async function scrapeManualBuhurt() {
  return MANUAL_BUHURT.map((e) => ({ ...e }))
}

async function scrapeVenue(venue, fallback) {
  try {
    process.stdout.write(`  Scraping ${venue.name}… `)
    let events
    if (venue.type === 'warhorn')        events = await scrapeWarhorn(venue)
    else if (venue.type === 'beton')         events = await scrapeBeton(venue)
    else if (venue.type === 'dbs-ical')      events = await scrapeDbsIcal(venue)
    else if (venue.type === 'ical')          events = await scrapeIcal(venue)
    else if (venue.type === 'helling')       events = await scrapeHelling(venue)
    else if (venue.type === 'acu')           events = await scrapeAcu(venue)
    else if (venue.type === 'soia')          events = await scrapeSoia(venue)
    else if (venue.type === 'buhurt-wob')    events = await scrapeWob(venue)
    else if (venue.type === 'buhurt-manual') events = await scrapeManualBuhurt(venue)
    else if (venue.type === 'buhurt-bi')     events = await scrapeBuhurtInternational(venue)
    else if (venue.type === 'tribe')          events = await scrapeTribe(venue)
    else if (venue.type === 'lab-monkey')    events = await scrapeLabMonkey(venue)
    else if (venue.type === 'casual-carnage') events = await scrapeCasualCarnage(venue)
    else if (venue.type === 'dcc')              events = await scrapeDcc(venue)
    else if (venue.type === 'spellenspektakel') events = await scrapeSpellenspektakel(venue)
    else if (venue.type === 'abunai')           events = await scrapeAbunai(venue)
    else if (venue.type === 'animecon')         events = await scrapeAnimecon(venue)
    else if (venue.type === 'ekko-wp')               events = await scrapeEkkoWp(venue)
    else if (venue.type === 'drachenwald-sca')       events = await scrapeDrachenwaldSca(venue)
    else if (venue.type === 'castlefest')             events = await scrapeCastlefest(venue)
    else if (venue.type === 'elfia')                  events = await scrapeElfia(venue)
    else if (venue.type === 'archeon')                events = await scrapeArcheon(venue)
    else if (venue.type === 'kommus-kasteelfestival') events = await scrapeKommusKasteelfestival(venue)
    else if (venue.type === 'muiderslot')            events = await scrapeMuiderslot(venue)
    else if (venue.type === 'slot-loevestein')       events = await scrapeSlotLoevestein(venue)
    else if (venue.type === 'ruine-brederode')       events = await scrapeRuineBrederode(venue)
    else if (venue.type === 'hoensbroek')            events = await scrapeHoensbroek(venue)
    else if (venue.type === 'montfort')              events = await scrapeMontfort(venue)
    else events = await scrapePodiuminfo(venue)

    // Sanity check: a silent break (HTML restructured, feed empty) returns 0 without throwing.
    // Flag as broken when the count drops suspiciously vs the previous run.
    const oldCount = fallback.length
    const suspicious =
      (events.length === 0 && oldCount > 3) ||
      (events.length < oldCount * 0.3 && oldCount > 5)
    if (suspicious) {
      console.log(`⚠ suspicious drop (${oldCount} → ${events.length}) — keeping existing, marking broken`)
      return { events: fallback, broken: true }
    }

    console.log(`${events.length} events`)
    return { events, broken: false }
  } catch (err) {
    console.log(`failed (${err.message}) — keeping existing, marking broken`)
    return { events: fallback, broken: true }
  }
}

async function main() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let existingByVenue = {}
  try {
    const existing = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'))
    for (const s of existing.sources ?? []) existingByVenue[s.id] = s.events ?? []
  } catch {}

  console.log('Scraping venues…')
  const sources = []
  for (const venue of VENUES) {
    const { events: raw, broken } = await scrapeVenue(venue, existingByVenue[venue.id] ?? [])
    const events = raw.filter(e => new Date(e.start) >= today)
    sources.push({ id: venue.id, name: venue.name, color: venue.color, icon: venue.icon, scene: venue.scene, feedUrl: venue.feedUrl, events, ...(broken ? { broken: true } : {}) })
    if (venue.type === 'podiuminfo') await new Promise(r => setTimeout(r, 500))
  }

  const total = sources.reduce((n, s) => n + s.events.length, 0)
  writeFileSync(OUTPUT_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), sources }, null, 2))
  console.log(`\nDone — ${total} events written to public/events.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
