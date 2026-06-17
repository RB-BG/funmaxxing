import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

/** Fetch the total event count for the boot flavor line (browser-cached, short timeout). */
async function fetchEventCount(): Promise<number | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 800)
    const res = await fetch("/events.json", { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data: { sources?: { events?: unknown[] }[] } = await res.json()
    return (data.sources ?? []).reduce((sum, s) => sum + (s.events?.length ?? 0), 0)
  } catch {
    return null
  }
}

function buildScript(count: number | null): string {
  const events = count === null ? "events online" : `${count} events online`
  return [
    "FUNMAXX OS  v1.4",
    "(c) 2026 funmaxxing systems utrecht",
    "",
    "> geheugen testen........ ok",
    "> venues verbinden....... ok",
    `> events.json laden...... ${events}`,
    "> agenda starten.........",
    "",
    "welkom terug, 47.",
  ].join("\n")
}

/** Delay before revealing the next character (slower on line breaks for a loading feel). */
function charDelay(ch: string): number {
  if (ch === "\n") return 90
  if (ch === ".") return 13
  return 9
}

interface BootScreenProps {
  onDone: () => void
}

/**
 * A fake BIOS/CRT boot intro that types itself out and then "powers on" the
 * agenda. The cold-open for the future funmaxxing desktop shell. Shown once per
 * session and skippable; the parent skips it entirely under reduced motion.
 */
export function BootScreen({ onDone }: BootScreenProps) {
  const [text, setText] = useState("")
  const [typing, setTyping] = useState(true)
  const doneRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let raf = 0
    let endTimer: ReturnType<typeof setTimeout> | undefined

    const callDone = () => {
      if (doneRef.current) return
      doneRef.current = true
      onDone()
    }

    // Safety backstop: never let the boot screen block access, even if rAF is
    // paused (hidden tab) or something stalls.
    const safety = setTimeout(callDone, 9000)

    async function run() {
      const count = await fetchEventCount()
      if (cancelled) return
      const script = buildScript(count)

      // Precompute the reveal time of each character, then drive the reveal from
      // elapsed time via rAF. This stays smooth and avoids background-tab
      // setTimeout throttling (which clamps timers to ~1s).
      const revealAt: number[] = []
      let acc = 120
      for (let k = 0; k < script.length; k++) {
        acc += charDelay(script[k])
        revealAt.push(acc)
      }

      const start = performance.now()
      const loop = (now: number) => {
        if (cancelled) return
        const elapsed = now - start
        let shown = 0
        while (shown < script.length && revealAt[shown] <= elapsed) shown++
        setText(script.slice(0, shown))
        if (shown >= script.length) {
          setTyping(false)
          endTimer = setTimeout(callDone, 500)
          return
        }
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }
    void run()

    const skip = () => callDone()
    window.addEventListener("keydown", skip)
    window.addEventListener("pointerdown", skip)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      clearTimeout(safety)
      if (endTimer) clearTimeout(endTimer)
      window.removeEventListener("keydown", skip)
      window.removeEventListener("pointerdown", skip)
    }
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ scaleY: 0.004, opacity: 0, filter: "brightness(3)" }}
      transition={{ duration: 0.4, ease: "easeIn" }}
      style={{ transformOrigin: "center" }}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#05070a] px-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.55) 3px)",
        }}
      />
      <pre
        className="relative m-0 max-w-full whitespace-pre-wrap font-display text-[clamp(18px,3.6vw,30px)] leading-tight text-[#7CFFB2]"
        style={{ textShadow: "0 0 7px rgba(124,255,178,0.65)" }}
      >
        {text}
        {typing && <span className="boot-caret">█</span>}
      </pre>
      <div className="absolute bottom-6 left-0 right-0 text-center font-display text-base text-[#7CFFB2]/45">
        klik of druk een toets om over te slaan
      </div>
    </motion.div>
  )
}
