import type { Fahrgast } from '../../../types/Fahrgast'
import { formatDateDisplay } from '../utils'

type PassengerDetailsCardProps = {
  selectedGuest: Fahrgast
}

export function PassengerDetailsCard({ selectedGuest }: PassengerDetailsCardProps) {
  return (
    <p className="px-6 pb-6 text-xs text-slate-500">
      Letzte Nutzung: {formatDateDisplay(selectedGuest.letzteNutzung)}
    </p>
  )
}
