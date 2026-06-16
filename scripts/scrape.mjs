import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../public/events.json')

const VENUES = [
  { id: 'dbs-utrecht',       name: "dB's Utrecht",         color: '#ef4444', icon: '🎸', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/5465/concerten/dBs/Utrecht/' },
  { id: 'ekko-utrecht',      name: 'EKKO Utrecht',          color: '#0ea5e9', icon: '🔵', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/60/concerten/EKKO/Utrecht/' },
  { id: 'de-helling',        name: 'De Helling',            color: '#22c55e', icon: '🟢', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/3/concerten/De-Helling/Utrecht/' },
  { id: 'nar-utrecht',       name: 'NAR Café der Kunsten',  color: '#a855f7', icon: '🟣', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/5623/concerten/NAR-Cafe-der-Kunsten/Utrecht/' },
  { id: 'tivoli-vredenburg', name: 'TivoliVredenburg',      color: '#e84b3a', icon: '🎵', type: 'podiuminfo', feedUrl: 'https://www.podiuminfo.nl/podium/3071/concerten/TivoliVredenburg/Utrecht/' },
  { id: 'rpg-night-utrecht', name: 'RPG Night Utrecht',     color: '#6366f1', icon: '🎲', type: 'warhorn',    feedUrl: 'https://warhorn.net/events/rpg-night-utrecht/schedule.atom' },
  { id: 'beton-t',           name: 'Beton-T',               color: '#f97316', icon: '🏗️',  type: 'beton',     feedUrl: 'https://www.vechtclub.nl/beton-t/agenda' },
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

async function scrapeVenue(venue, fallback) {
  try {
    process.stdout.write(`  Scraping ${venue.name}… `)
    let events
    if (venue.type === 'warhorn') events = await scrapeWarhorn(venue)
    else if (venue.type === 'beton') events = await scrapeBeton(venue)
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
