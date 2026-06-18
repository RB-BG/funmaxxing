import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MANUAL_BUHURT } from './manual-buhurt.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../public/events.json')

// Each source belongs to a "scene" (a city/topic the app can switch between).
const VENUES = [
  { id: 'dbs-utrecht',       name: "dB's Utrecht",         color: '#ef4444', icon: '🎸', scene: 'utrecht', type: 'dbs-ical',   feedUrl: 'https://dbstudio.nl/events/?ical=1' },
  { id: 'ekko-utrecht',      name: 'EKKO Utrecht',          color: '#0ea5e9', icon: '🔵', scene: 'utrecht', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/60/concerten/EKKO/Utrecht/' },
  { id: 'de-helling',        name: 'De Helling',            color: '#22c55e', icon: '🟢', scene: 'utrecht', type: 'helling',    feedUrl: 'https://dehelling.nl/agenda' },
  { id: 'nar-utrecht',       name: 'NAR Café der Kunsten',  color: '#a855f7', icon: '🟣', scene: 'utrecht', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/5623/concerten/NAR-Cafe-der-Kunsten/Utrecht/' },
  { id: 'tivoli-vredenburg', name: 'TivoliVredenburg',      color: '#e84b3a', icon: '🎵', scene: 'utrecht', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/3071/concerten/TivoliVredenburg/Utrecht/' },
  { id: 'rpg-night-utrecht', name: 'RPG Night Utrecht',     color: '#6366f1', icon: '🎲', scene: 'utrecht', type: 'warhorn',    feedUrl: 'https://warhorn.net/events/rpg-night-utrecht/schedule.atom' },
  { id: 'beton-t',           name: 'Beton-T',               color: '#f97316', icon: '🏗️',  scene: 'utrecht', type: 'beton',     feedUrl: 'https://www.vechtclub.nl/beton-t/agenda' },
  { id: 'acu-utrecht',       name: 'ACU Utrecht',           color: '#84cc16', icon: '✊',   scene: 'utrecht', type: 'acu',       feedUrl: 'https://acu.nl/events/feed/' },
  { id: 'basis-utrecht',     name: 'BASIS',                 color: '#14b8a6', icon: '🔊', scene: 'utrecht', type: 'ical',      feedUrl: 'https://clubbasis.nl/events/?ical=1' },
  { id: 'soia-utrecht',      name: 'Strand Oog in Al',      color: '#eab308', icon: '🏖️', scene: 'utrecht', type: 'soia',      feedUrl: 'https://soia.nl/agenda/feed/' },

  // Buhurt scene (medieval armored combat), Europe only.
  { id: 'buhurt-eu',         name: 'Buhurt toernooien (EU)', color: '#b61e1e', icon: '⚔️', scene: 'buhurt', type: 'buhurt-wob',    feedUrl: 'https://www.worldofbuhurt.com/tournaments' },
  { id: 'buhurt-clubnights', name: 'Buhurt club nights',     color: '#9b51e0', icon: '🛡️', scene: 'buhurt', type: 'buhurt-manual', feedUrl: '' },
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

function parseIcalDatetime(dtStr) {
  // "20260617T200000" (TZID=Europe/Amsterdam assumed)
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

/** Scrape worldofbuhurt's tournament list (SSR HTML), Europe only. */
async function scrapeWob(venue) {
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const events = []
  const seen = new Set()
  const re = /<a href="(https:\/\/www\.worldofbuhurt\.com\/tournaments\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g
  for (const [, url, block] of html.matchAll(re)) {
    if (seen.has(url)) continue
    seen.add(url)

    const title = decodeXml(
      (block.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? block.match(/alt="([^"]+)"/)?.[1] ?? '').trim(),
    )
    const locRaw = block.match(/tournament-small-location[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ''
    // Strip tags, the "Location:" label and the trailing flag emoji (keep latin diacritics).
    const locText = stripHtml(decodeXml(locRaw))
      .replace(/^Location:\s*/i, '')
      .replace(/[^ -ɏ,]/g, '')
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

  return events
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
    else events = await scrapePodiuminfo(venue)
    console.log(`${events.length} events`)
    return events
  } catch (err) {
    console.log(`failed (${err.message}) — keeping existing`)
    return fallback
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
    const raw = await scrapeVenue(venue, existingByVenue[venue.id] ?? [])
    const events = raw.filter(e => new Date(e.start) >= today)
    sources.push({ id: venue.id, name: venue.name, color: venue.color, icon: venue.icon, scene: venue.scene, feedUrl: venue.feedUrl, events })
    if (venue.type === 'podiuminfo') await new Promise(r => setTimeout(r, 500))
  }

  const total = sources.reduce((n, s) => n + s.events.length, 0)
  writeFileSync(OUTPUT_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), sources }, null, 2))
  console.log(`\nDone — ${total} events written to public/events.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
