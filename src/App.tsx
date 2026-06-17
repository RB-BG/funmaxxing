import { Suspense, useCallback, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { SoundProvider } from "@/ui/SoundProvider"
import { CustomCursor } from "@/ui/CustomCursor"
import { ErrorBoundary } from "@/ui/ErrorBoundary"
import { BootScreen } from "@/ui/BootScreen"
import { APPS } from "@/shell/AppRegistry"

function shouldBoot(): boolean {
  try {
    if (sessionStorage.getItem("funmax-booted")) return false
  } catch {
    // ignore storage errors
  }
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  } catch {
    // ignore matchMedia errors
  }
  return true
}

function App() {
  // For now we boot straight into the agenda app. A future desktop shell can
  // render APPS as icons/windows instead.
  const Agenda = APPS[0].Component
  const [booting, setBooting] = useState(shouldBoot)

  const finishBoot = useCallback(() => {
    try {
      sessionStorage.setItem("funmax-booted", "1")
    } catch {
      // ignore storage errors
    }
    setBooting(false)
  }, [])

  return (
    <ErrorBoundary>
      <SoundProvider>
        <CustomCursor />
        <AnimatePresence>
          {booting && <BootScreen key="boot" onDone={finishBoot} />}
        </AnimatePresence>
        {!booting && (
          <Suspense
            fallback={<div className="p-10 text-center font-display text-lg uppercase text-ink/60">Booten…</div>}
          >
            <Agenda />
          </Suspense>
        )}
      </SoundProvider>
    </ErrorBoundary>
  )
}

export default App
