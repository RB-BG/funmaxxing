import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { useReducedMotion } from "./useReducedMotion"
import { useMediaQuery } from "./useMediaQuery"

const INTERACTIVE = "a,button,[role=button],input,label,select,textarea,[data-cursor='grow']"

/**
 * A spring-following custom cursor: a laggy outer ring + a snappy inner dot,
 * both in the active app accent. Disabled on touch / coarse pointers and when
 * the user prefers reduced motion (the native cursor is left intact then).
 */
export function CustomCursor() {
  const reduced = useReducedMotion()
  const fine = useMediaQuery("(pointer: fine)")
  const enabled = fine && !reduced
  const [hovering, setHovering] = useState(false)
  const [down, setDown] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 350, damping: 28 })
  const ringY = useSpring(y, { stiffness: 350, damping: 28 })

  useEffect(() => {
    if (!enabled) return

    document.body.classList.add("has-custom-cursor")

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      setHovering(Boolean(target?.closest(INTERACTIVE)))
    }
    const onDown = () => setDown(true)
    const onUp = () => setDown(false)

    window.addEventListener("pointermove", onMove)
    window.addEventListener("mouseover", onOver)
    window.addEventListener("pointerdown", onDown)
    window.addEventListener("pointerup", onUp)

    return () => {
      document.body.classList.remove("has-custom-cursor")
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("mouseover", onOver)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  const ringScale = down ? 0.8 : hovering ? 1.7 : 1

  return (
    <>
      <motion.div aria-hidden style={{ x: ringX, y: ringY }} className="pointer-events-none fixed left-0 top-0 z-[9999]">
        <motion.div
          animate={{ scale: ringScale }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="-ml-4 -mt-4 h-8 w-8 rounded-full border-2"
          style={{ borderColor: "var(--app-accent)" }}
        />
      </motion.div>
      <motion.div aria-hidden style={{ x, y }} className="pointer-events-none fixed left-0 top-0 z-[9999]">
        <div className="-ml-1 -mt-1 h-2 w-2 rounded-full" style={{ background: "var(--app-accent)" }} />
      </motion.div>
    </>
  )
}
