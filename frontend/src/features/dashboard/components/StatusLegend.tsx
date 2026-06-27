import { rideStatusLegend } from '../../../config/rideStatusConfig'

export function StatusLegend() {
  return (
    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-5">
      {rideStatusLegend.map((status) => (
        <div key={status.label} className="inline-flex items-center gap-2 text-sm text-slate-500">
          <span className={`h-3 w-3 rounded-full ${status.color}`} />
          {status.label}
        </div>
      ))}
    </div>
  )
}
