import { useCallback, useRef, useState, type ReactNode } from "react"
import { SoundContext, type Sfx } from "./sound"

const STORAGE_KEY = "funmax-muted"

type OscType = "square" | "sawtooth" | "sine" | "triangle"

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback((): AudioContext | null => {
    if (!ctxRef.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctxRef.current = new AC()
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const play = useCallback(
    (sfx: Sfx) => {
      if (muted) return
      const ctx = getCtx()
      if (!ctx) return

      const tone = (freq: number, start: number, dur: number, type: OscType, peak: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const t0 = ctx.currentTime + start
        osc.type = type
        osc.frequency.setValueAtTime(freq, t0)
        gain.gain.setValueAtTime(0, t0)
        gain.gain.linearRampToValueAtTime(peak, t0 + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t0)
        osc.stop(t0 + dur)
      }

      switch (sfx) {
        case "hover":
          tone(880, 0, 0.05, "square", 0.025)
          break
        case "click":
          tone(440, 0, 0.08, "square", 0.05)
          break
        case "select":
          tone(660, 0, 0.07, "square", 0.05)
          tone(990, 0.06, 0.1, "square", 0.045)
          break
        case "deselect":
          tone(440, 0, 0.07, "square", 0.045)
          tone(300, 0.06, 0.1, "square", 0.04)
          break
        case "add":
          ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.06, 0.18, "square", 0.05))
          break
        case "whoosh":
          tone(200, 0, 0.22, "sawtooth", 0.035)
          break
      }
    },
    [muted, getCtx],
  )

  const toggle = useCallback(() => {
    setMuted((m) => {
      const next = !m
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      } catch {
        // ignore storage errors (private mode etc.)
      }
      return next
    })
  }, [])

  return <SoundContext.Provider value={{ muted, toggle, play }}>{children}</SoundContext.Provider>
}
