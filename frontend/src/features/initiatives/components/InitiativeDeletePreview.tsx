import type { Initiative } from '../../../types/Initiative'
import type { InitiativeDeletePreview as InitiativeDeletePreviewType } from '../../../types/Initiative'
import { isDefaultInitiative } from '../utils'

type InitiativeDeletePreviewProps = {
  initiative: Initiative
  deletePreview: InitiativeDeletePreviewType | null
  isDeletePreviewLoading: boolean
}

export function InitiativeDeletePreview({
  initiative,
  deletePreview,
  isDeletePreviewLoading,
}: InitiativeDeletePreviewProps) {
  if (isDefaultInitiative(initiative)) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Die Standard-Initiative kann nicht gelöscht werden.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      {isDeletePreviewLoading ? (
        <p>Ermittle abhängige Daten ...</p>
      ) : deletePreview ? (
        <div className="space-y-2">
          <p className="font-semibold text-rose-700">
            Diese Initiative wird gelöscht. Alle zugehörigen Fahrten, Fahrzeuge, Fahrgäste und
            weiteren Daten werden entfernt.
          </p>

          <p>
            Benutzer bleiben erhalten und werden der Default-Initiative zugeordnet.
          </p>

          <p className="font-semibold text-slate-800">Betroffene Daten laut Vorschau:</p>

          <ul className="list-disc space-y-1 pl-5">
            <li>{deletePreview.affected.users} Benutzer-Zuordnungen</li>
            <li>{deletePreview.affected.vehicles} Fahrzeuge</li>
            <li>{deletePreview.affected.maintenanceRecords} Wartungseinträge</li>
            <li>{deletePreview.affected.damageReports} Schadensmeldungen</li>
            <li>{deletePreview.affected.rides} Fahrten</li>
            <li>{deletePreview.affected.rideSegments} Teilstrecken</li>
            <li>{deletePreview.affected.passengers} Fahrgäste</li>
          </ul>

          <p className="pt-1 text-xs text-slate-600">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-semibold text-rose-700">
            Diese Initiative wird gelöscht. Alle zugehörigen Daten werden entfernt.
          </p>

          <p>
            Benutzer bleiben erhalten und werden der Default-Initiative zugeordnet.
          </p>

          <p className="text-slate-600">Vorschau konnte nicht geladen werden.</p>
        </div>
      )}
    </div>
  )
}
