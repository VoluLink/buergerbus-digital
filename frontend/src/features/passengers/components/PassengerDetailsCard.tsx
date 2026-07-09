import type { Fahrgast } from '../../../types/Fahrgast'
import { formatDateDisplay } from '../utils'

type PassengerDetailsCardProps = {
  selectedGuest: Fahrgast
}

export function PassengerDetailsCard({ selectedGuest }: PassengerDetailsCardProps) {
  return (
    <p className="px-4 pb-5 text-xs text-slate-500 sm:px-6 sm:pb-6">
      Letzte Nutzung: {formatDateDisplay(selectedGuest.letzteNutzung)}
    </p>
  )
}
