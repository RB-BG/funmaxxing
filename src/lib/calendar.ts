import type { EnrichedEvent } from "@/types"

/** Convert ISO string to compact UTC datetime for Google Calendar / ICS (YYYYMMDDTHHmmssZ). */
function toISOBasic(isoStr: string): string {
  return new Date(isoStr).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

/** Format an ISO datetime as a localized NL time (HH:mm). */
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
}

/** Build a Google Calendar "add event" URL for a single event. */
export function gcalUrl(event: EnrichedEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${event.source.icon} ${event.title}`,
    dates: `${toISOBasic(event.start)}/${toISOBasic(event.end)}`,
    details: `${event.description ?? ""}\n\n🔗 ${event.url}`,
    location: event.location,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

/** Generate an .ics file string for multiple events. */
export function generateICS(events: EnrichedEvent[]): string {
  const esc = (str: string | undefined) =>
    (str ?? "").replace(/\n/g, "\\n").replace(/,/g, "\\,")

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Utrecht Events//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  events.forEach((e) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:utrecht-events-${e.id}@local`,
      `DTSTART:${toISOBasic(e.start)}`,
      `DTEND:${toISOBasic(e.end)}`,
      `SUMMARY:${esc(e.source.icon + " " + e.title)}`,
      `DESCRIPTION:${esc(e.description)}\\n\\n🔗 ${e.url}`,
      `LOCATION:${esc(e.location)}`,
      `URL:${e.url}`,
      "END:VEVENT",
    )
  })

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

/** Trigger a browser download of the given events as an .ics file. */
export function downloadICS(events: EnrichedEvent[]): void {
  if (!events.length) return
  const blob = new Blob([generateICS(events)], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "utrecht-events.ics"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
