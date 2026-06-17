import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Catches render errors so a single broken app doesn't blank the whole page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-[640px] p-6">
          <div className="bezel bg-white p-4">
            <h1 className="font-pixel text-[12px] uppercase text-hot">Oeps, er ging iets stuk</h1>
            <p className="mt-3 text-sm text-ink/80">Ververs de pagina. Foutmelding (dev):</p>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-[11px] text-ink/70">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
