import { Trash2 } from "lucide-react";
import { AddressAutocomplete } from "../../../../components/AddressAutocomplete";

import { FiveMinuteTimeField } from "../FiveMinuteTimeField";

import type { RideFormState } from "../../types/rideFormTypes";
import type { RideType } from "../../../../types/DashboardRide";
import type { Fahrgast } from "../../../../types/Fahrgast";

type PassengerForm = RideFormState["passengers"][number];

type UpdatePassengerField = (
  passengerId: number,
  field: keyof Omit<PassengerForm, "id" | "sourceGuestId" | "saveAsGuest">,
  value: string | boolean,
) => void;

type PassengerRowProps = {
  passenger: PassengerForm;
  passengerIndex: number;
  rideType: RideType;
  knownGuests: Fahrgast[];
  updatePassengerField: UpdatePassengerField;
  autofillPassengerFromKnownGuest: (
    passengerId: number,
    selectedGuestId: number,
  ) => void;
  updatePassengerSaveAsGuest: (passengerId: number, value: boolean) => void;
  removePassengerField: (passengerId: number) => void;
};

export function PassengerRow({
  passenger,
  passengerIndex,
  rideType,
  knownGuests,
  updatePassengerField,
  autofillPassengerFromKnownGuest,
  updatePassengerSaveAsGuest,
  removePassengerField,
}: PassengerRowProps) {
  const passengerName = passenger.name ?? "";
  const passengerSearchQuery = passengerName.trim().toLowerCase();

  const matchingGuests =
    passengerSearchQuery.length > 0
      ? knownGuests
          .filter((guest) => guest.aktiv)
          .filter((guest) => {
            const searchable =
              `${guest.vorname ?? ""} ${guest.nachname ?? ""} ${guest.adresse ?? ""} ${guest.telefonnummer ?? ""}`.toLowerCase();

            return searchable.includes(passengerSearchQuery);
          })
          .slice(0, 6)
      : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Fahrgast {passengerIndex + 1}
        </div>

        <button
          type="button"
          onClick={() => removePassengerField(passenger.id)}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Entfernen
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative sm:col-span-2">
          <input
            type="text"
            value={passengerName}
            onChange={(event) =>
              updatePassengerField(passenger.id, "name", event.target.value)
            }
            placeholder="Name des Fahrgasts (z. B. Max)"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
          />

          {matchingGuests.length > 0 ? (
            <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              {matchingGuests.map((guest) => (
                <button
                  key={guest.id}
                  type="button"
                  onClick={() =>
                    autofillPassengerFromKnownGuest(passenger.id, guest.id)
                  }
                  className="flex w-full flex-col items-start border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 last:border-b-0"
                >
                  <span className="font-semibold text-slate-800">
                    {`${guest.vorname ?? ""} ${guest.nachname ?? ""}`.trim()}
                  </span>

                  <span className="text-xs text-slate-500">
                    {guest.adresse ?? ""}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {passenger.sourceGuestId == null ? (
          <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(passenger.saveAsGuest)}
              onChange={(event) =>
                updatePassengerSaveAsGuest(passenger.id, event.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Als Stammgast speichern
          </label>
        ) : (
          <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
            Stammgast ausgewählt
          </div>
        )}

        <input
          type="text"
          value={passenger.phone ?? ""}
          onChange={(event) =>
            updatePassengerField(passenger.id, "phone", event.target.value)
          }
          placeholder="Telefonnummer"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
        />

        <AddressAutocomplete
          value={passenger.pickupAddress ?? ""}
          onChange={(value) => updatePassengerField(passenger.id, "pickupAddress", value)}
          placeholder="Abholadresse"
        />

        {rideType === "theme" ? null : (
          <AddressAutocomplete
            value={passenger.destinationAddress ?? ""}
            onChange={(value) => updatePassengerField(passenger.id, "destinationAddress", value)}
            placeholder="Zieladresse"
          />
        )}

        <label className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-500">
          <FiveMinuteTimeField
            value={passenger.time ?? ""}
            onChange={(nextValue) =>
              updatePassengerField(passenger.id, "time", nextValue)
            }
            wrapperClassName="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"
            fieldClassName="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none"
          />
        </label>
      </div>
    </div>
  );
}
