import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../public/events.json')

const VENUES = [
  { id: 'dbs-utrecht',       name: "dB's Utrecht",         color: '#ef4444', icon: '🎸', type: 'dbs-ical',   feedUrl: 'https://dbstudio.nl/events/?ical=1' },
  { id: 'ekko-utrecht',      name: 'EKKO Utrecht',          color: '#0ea5e9', icon: '🔵', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/60/concerten/EKKO/Utrecht/' },
  { id: 'de-helling',        name: 'De Helling',            color: '#22c55e', icon: '🟢', type: 'helling',    feedUrl: 'https://dehelling.nl/agenda' },
  { id: 'nar-utrecht',       name: 'NAR Café der Kunsten',  color: '#a855f7', icon: '🟣', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/5623/concerten/NAR-Cafe-der-Kunsten/Utrecht/' },
  { id: 'tivoli-vredenburg', name: 'TivoliVredenburg',      color: '#e84b3a', icon: '🎵', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/3071/concerten/TivoliVredenburg/Utrecht/' },
  { id: 'rpg-night-utrecht', name: 'RPG Night Utrecht',     color: '#6366f1', icon: '🎲', type: 'warhorn',    feedUrl: 'https://warhorn.net/events/rpg-night-utrecht/schedule.atom' },
  { id: 'beton-t',           name: 'Beton-T',               color: '#f97316', icon: '🏗️',  type: 'beton',     feedUrl: 'https://www.vechtclub.nl/beton-t/agenda' },
  { id: 'acu-utrecht',       name: 'ACU Utrecht',           color: '#84cc16', icon: '✊',   type: 'acu',       feedUrl: 'https://acu.nl/agenda' },
]

const NL_MONTHS = { jan:1, feb:2, mrt:3, apr:4, mei:5, jun:6, jul:7, aug:8, sep:9, okt:10, nov:11, dec:12 }

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
  const res = await fetch(venue.feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; funmaxxing-scraper/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const events = []
  const seen = new Set()

  for (const [, url, dateStr, block] of html.matchAll(
    /<a[^>]*href="(https:\/\/acu\.nl\/events\/(\d{8})\/[^"]+)"[\s\S]*?>([\s\S]*?)<\/a>/g
  )) {
    if (seen.has(url)) continue
    seen.add(url)

    const title = block.match(/class="[^"]*pseudo-h2[^"]*">([^<]+)</)?.[1]?.trim()
    const desc  = block.match(/class="[^"]*pseudo-h3[^"]*">([^<]+)</)?.[1]?.trim() ?? ''
    const time  = block.match(/<span class="AgendaDetail">(\d{1,2}:\d{2})<\/span>/)?.[1]

    if (!title) continue

    const y = dateStr.slice(0, 4), mo = dateStr.slice(4, 6), d = dateStr.slice(6, 8)
    const tz = (parseInt(mo) >= 4 && parseInt(mo) <= 9) ? '+02:00' : '+01:00'
    const start = time
      ? `${y}-${mo}-${d}T${time}:00${tz}`
      : `${y}-${mo}-${d}T00:00:00${tz}`

    events.push({
      id: `acu-${dateStr}-${url.split('/').pop()}`,
      title: decodeXml(title),
      start,
      end: start,
      location: 'ACU, Voorstraat 71, Utrecht',
      description: truncate(decodeXml(desc)),
      url,
      tags: [],
    })
  }

  return events
}

async function scrapeVenue(venue, fallback) {
  try {
    process.stdout.write(`  Scraping ${venue.name}… `)
    let events
    if (venue.type === 'warhorn')   events = await scrapeWarhorn(venue)
    else if (venue.type === 'beton')    events = await scrapeBeton(venue)
    else if (venue.type === 'dbs-ical') events = await scrapeDbsIcal(venue)
    else if (venue.type === 'helling')  events = await scrapeHelling(venue)
    else if (venue.type === 'acu')      events = await scrapeAcu(venue)
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
    sources.push({ id: venue.id, name: venue.name, color: venue.color, icon: venue.icon, feedUrl: venue.feedUrl, events })
    if (venue.type === 'podiuminfo') await new Promise(r => setTimeout(r, 500))
  }

  const total = sources.reduce((n, s) => n + s.events.length, 0)
  writeFileSync(OUTPUT_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), sources }, null, 2))
  console.log(`\nDone — ${total} events written to public/events.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
