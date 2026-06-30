import { Bus, Check, UserRound } from "lucide-react";

import { FiveMinuteTimeField } from "../FiveMinuteTimeField";
import { PassengerList } from "./PassengerList";

import type { RideFormState } from "../../types/rideFormTypes";
import type { RideType } from "../../../../types/DashboardRide";
import type { Fahrgast } from "../../../../types/Fahrgast";
import type { FahrerListItem } from "../../../../types/FahrerListItem";
import type { Fahrzeug } from "../../../../types/Fahrzeug";

type PassengerForm = RideFormState["passengers"][number];

type UpdatePassengerField = (
  passengerId: number,
  field: keyof Omit<PassengerForm, "id" | "sourceGuestId" | "saveAsGuest">,
  value: string | boolean,
) => void;

type RegularRideFormProps = {
  rideType: RideType;
  activeRideForm: RideFormState | null;

  visibleFahrzeuge: Fahrzeug[];
  fahrerListe: FahrerListItem[];
  knownGuests: Fahrgast[];

  selectedRideVehicle: Fahrzeug | null;
  maxPassengersForActiveRide: number;
  isPassengerLimitReached: boolean;

  updateRideField: (
    field: keyof Omit<RideFormState, "passengers">,
    value: string,
  ) => void;

  updatePassengerField: UpdatePassengerField;

  autofillFahrer: (selectedFahrerId: number) => void;
  autofillFahrzeug: (selectedFahrzeugId: number) => void;

  autofillPassengerFromKnownGuest: (
    passengerId: number,
    selectedGuestId: number,
  ) => void;

  updatePassengerSaveAsGuest: (passengerId: number, value: boolean) => void;

  addPassengerField: () => void;
  removePassengerField: (passengerId: number) => void;
};

export function RegularRideForm({
  rideType,
  activeRideForm,
  visibleFahrzeuge,
  fahrerListe,
  knownGuests,
  selectedRideVehicle,
  maxPassengersForActiveRide,
  isPassengerLimitReached,
  updateRideField,
  updatePassengerField,
  autofillFahrer,
  autofillFahrzeug,
  autofillPassengerFromKnownGuest,
  updatePassengerSaveAsGuest,
  addPassengerField,
  removePassengerField,
}: RegularRideFormProps) {
  const isDriverAssigned = Boolean(activeRideForm?.fahrerId);
  const driverQuery = (activeRideForm?.driverName ?? "").trim().toLowerCase();

  const matchingDrivers =
    driverQuery.length > 0 && !isDriverAssigned
      ? fahrerListe
          .filter((driver) => {
            const searchable =
              `${driver.name} ${driver.telefonnummer ?? ""}`.toLowerCase();

            return searchable.includes(driverQuery);
          })
          .slice(0, 6)
      : [];

  return (
    <>
      <div className="mt-6">
        <label
          htmlFor="vehicle-name"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          <Bus className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
          Fahrzeug
        </label>

        <select
          id="vehicle-name"
          value={activeRideForm?.fahrzeugId ?? ""}
          onChange={(event) => autofillFahrzeug(Number(event.target.value))}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
        >
          <option value="">Fahrzeug auswählen</option>

          {visibleFahrzeuge.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.kennzeichen} – {vehicle.bezeichnung} –{" "}
              {vehicle.kapazitaet} Plätze
            </option>
          ))}
        </select>

        {visibleFahrzeuge.length === 0 ? (
          <p className="mt-2 text-sm text-amber-700">
            Kein Fahrzeug verfügbar.
          </p>
        ) : visibleFahrzeuge.length === 1 ? (
          <p className="mt-2 text-sm text-emerald-700">
            Ein Fahrzeug wurde automatisch vorausgewählt.
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <label
          htmlFor="driver-name"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          <UserRound className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
          Fahrer (max. 1)
          {isDriverAssigned ? (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Fahrer zugewiesen
            </span>
          ) : null}
        </label>

        <input
          id="driver-name"
          type="text"
          value={activeRideForm?.driverName ?? ""}
          onChange={(event) =>
            updateRideField("driverName", event.target.value)
          }
          placeholder="Name des Fahrers"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
        />

        {matchingDrivers.length > 0 ? (
          <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {matchingDrivers.map((driver) => (
              <button
                key={driver.fahrerId}
                type="button"
                onClick={() => autofillFahrer(driver.fahrerId)}
                className="flex w-full flex-col items-start border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 last:border-b-0"
              >
                <span className="font-semibold text-slate-800">
                  {driver.name}
                </span>

                <span className="text-xs text-slate-500">
                  {driver.telefonnummer ?? "Keine Telefonnummer"}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-700">
          Geschätzte Endzeit
        </label>

        <FiveMinuteTimeField
          value={activeRideForm?.endTime ?? ""}
          onChange={(nextValue) => updateRideField("endTime", nextValue)}
        />
      </div>

      <PassengerList
        rideType={rideType}
        activeRideForm={activeRideForm}
        knownGuests={knownGuests}
        selectedRideVehicle={selectedRideVehicle}
        maxPassengersForActiveRide={maxPassengersForActiveRide}
        isPassengerLimitReached={isPassengerLimitReached}
        updatePassengerField={updatePassengerField}
        autofillPassengerFromKnownGuest={autofillPassengerFromKnownGuest}
        updatePassengerSaveAsGuest={updatePassengerSaveAsGuest}
        addPassengerField={addPassengerField}
        removePassengerField={removePassengerField}
      />
    </>
  );
}
