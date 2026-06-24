import { useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/** A flat, aligned panel with a colored header strip (Steam-style block). */
export function Panel({
  title,
  accent,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string
  accent?: string
  children: ReactNode
  className?: string
  /** When true, the header toggles the body open/closed. */
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const showBody = !collapsible || open
  const headerStyle = { background: accent ?? "var(--app-accent-2)" }
  const headerBase = cn(
    "px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink",
    showBody && "border-b-2 border-ink",
  )

  return (
    <section className={cn("overflow-hidden rounded-md border-2 border-ink bg-white", className)}>
      {collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          style={headerStyle}
          className={cn(headerBase, "flex w-full items-center justify-between")}
        >
          <span>{title}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "" : "-rotate-90")} strokeWidth={3} />
        </button>
      ) : (
        <header className={headerBase} style={headerStyle}>
          {title}
        </header>
      )}
      {showBody && children}
    </section>
  )
}

/** A plain bordered container (no header). */
export function RetroPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md border-2 border-ink bg-white", className)} {...props} />
}

/** A pressable button: readable sans label, hard shadow that presses in on click. */
export function RetroButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-md border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink",
        "shadow-[2px_2px_0_0_var(--ink)] transition-transform",
        "hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0",
        className,
      )}
      {...props}
    />
  )
}
