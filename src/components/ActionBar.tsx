interface ActionBarProps {
  count: number
  onSelectAll: () => void
  onClear: () => void
  onDownload: () => void
}

export function ActionBar({ count, onSelectAll, onClear, onDownload }: ActionBarProps) {
  return (
    <div className="fixed bottom-3 left-1/2 z-[100] flex w-[calc(100%-32px)] max-w-[620px] -translate-x-1/2 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 shadow-[0_2px_16px_rgba(0,0,0,0.09)]">
      <button
        type="button"
        onClick={onSelectAll}
        className="cursor-pointer whitespace-nowrap rounded-md bg-neutral-100 px-3 py-1.5 text-[13px] font-medium text-neutral-700"
      >
        Alles
      </button>
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer whitespace-nowrap rounded-md bg-neutral-100 px-3 py-1.5 text-[13px] font-medium text-neutral-700"
      >
        Wissen
      </button>
      <div className="flex-1 text-center text-xs text-neutral-400">
        {count > 0 ? `${count} geselecteerd` : "Tik events aan om te selecteren"}
      </div>
      <button
        type="button"
        onClick={onDownload}
        disabled={count === 0}
        className="cursor-pointer whitespace-nowrap rounded-md bg-neutral-900 px-3 py-1.5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-35"
      >
        {count > 0 ? `⬇ ICS (${count})` : "⬇ ICS"}
      </button>
    </div>
  )
}
