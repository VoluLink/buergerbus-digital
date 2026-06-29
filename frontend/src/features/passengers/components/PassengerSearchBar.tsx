import { Search } from 'lucide-react'

type PassengerSearchBarProps = {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
}

export function PassengerSearchBar({
  searchQuery,
  onSearchQueryChange,
}: PassengerSearchBarProps) {
  return (
    <div className="mt-4 w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Suche nach Name, Adresse, Telefonnummer ..."
          className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
        />
      </div>
    </div>
  )
}
