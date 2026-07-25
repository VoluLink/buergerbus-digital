import { LoaderCircle, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { searchAddresses, type AddressSuggestion } from '../services/addressApi'

type AddressAutocompleteProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}

export function AddressAutocomplete({ id, value, onChange, placeholder, className = '' }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const query = value.trim()
    if (query.length < 3) {
      setSuggestions([])
      setMessage(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      setMessage(null)
      try {
        const nextSuggestions = await searchAddresses(query, controller.signal)
        if (!controller.signal.aborted) {
          setSuggestions(nextSuggestions)
          setActiveIndex(-1)
          setMessage(nextSuggestions.length === 0 ? 'Keine passende Adresse gefunden.' : null)
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([])
          setMessage('Adresssuche nicht erreichbar – manuelle Eingabe ist weiterhin möglich.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [value])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setSuggestions([])
        setMessage(null)
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.label)
    setSuggestions([])
    setMessage(null)
  }

  return <div ref={rootRef} className="relative">
    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0053a0]" aria-hidden="true" />
    <input
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { setSuggestions([]); setMessage(null) }
        if (event.key === 'ArrowDown' && suggestions.length) { event.preventDefault(); setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1)) }
        if (event.key === 'ArrowUp' && suggestions.length) { event.preventDefault(); setActiveIndex((current) => Math.max(current - 1, 0)) }
        if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); selectSuggestion(suggestions[activeIndex]) }
      }}
      placeholder={placeholder}
      role="combobox"
      aria-expanded={suggestions.length > 0}
      aria-autocomplete="list"
      className={`w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15 ${className}`}
    />
    {isLoading ? <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#0053a0]" aria-label="Adresssuche läuft" /> : null}
    {(suggestions.length > 0 || message) ? <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      {suggestions.map((suggestion, index) => <button key={suggestion.label} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectSuggestion(suggestion)} className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 last:border-b-0 ${index === activeIndex ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>{suggestion.label}</button>)}
      {message ? <p className="px-3 py-2 text-sm text-slate-500">{message}</p> : null}
    </div> : null}
  </div>
}
