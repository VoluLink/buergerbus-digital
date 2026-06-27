import { Users } from "lucide-react";

import { PassengerRow } from "./PassengerRow";

import type { RideFormState } from "../../types/rideFormTypes";
import type { RideType } from "../../../../types/DashboardRide";
import type { Fahrgast } from "../../../../types/Fahrgast";
import type { Fahrzeug } from "../../../../types/Fahrzeug";

type PassengerForm = RideFormState["passengers"][number];

type UpdatePassengerField = (
  passengerId: number,
  field: keyof Omit<PassengerForm, "id" | "sourceGuestId" | "saveAsGuest">,
  value: string | boolean,
) => void;

type PassengerListProps = {
  rideType: RideType;
  activeRideForm: RideFormState | null;
  knownGuests: Fahrgast[];

  selectedRideVehicle: Fahrzeug | null;
  maxPassengersForActiveRide: number;
  isPassengerLimitReached: boolean;

  updatePassengerField: UpdatePassengerField;
  autofillPassengerFromKnownGuest: (
    passengerId: number,
    selectedGuestId: number,
  ) => void;
  updatePassengerSaveAsGuest: (passengerId: number, value: boolean) => void;

  addPassengerField: () => void;
  removePassengerField: (passengerId: number) => void;
};

export function PassengerList({
  rideType,
  activeRideForm,
  knownGuests,
  selectedRideVehicle,
  maxPassengersForActiveRide,
  isPassengerLimitReached,
  updatePassengerField,
  autofillPassengerFromKnownGuest,
  updatePassengerSaveAsGuest,
  addPassengerField,
  removePassengerField,
}: PassengerListProps) {
  const passengers = activeRideForm?.passengers ?? [];

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Users className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
          {rideType === "theme"
            ? `Fahrgäste Themenfahrt (max. ${
                maxPassengersForActiveRide || "Fahrzeugkapazität"
              })`
            : `Fahrgäste (max. ${
                maxPassengersForActiveRide || "Fahrzeugkapazität"
              })`}
        </p>
      </div>

      <div className="space-y-3">
        {passengers.map((passenger, passengerIndex) => (
          <PassengerRow
            key={passenger.id}
            passenger={passenger}
            passengerIndex={passengerIndex}
            rideType={rideType}
            knownGuests={knownGuests}
            updatePassengerField={updatePassengerField}
            autofillPassengerFromKnownGuest={autofillPassengerFromKnownGuest}
            updatePassengerSaveAsGuest={updatePassengerSaveAsGuest}
            removePassengerField={removePassengerField}
          />
        ))}

        {passengers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Noch keine Fahrgäste hinzugefügt.
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex justify-start">
        <button
          type="button"
          onClick={addPassengerField}
          disabled={selectedRideVehicle == null || isPassengerLimitReached}
          className="rounded-xl bg-[#0053a0]/12 px-3 py-1.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Fahrgast hinzufügen
        </button>
      </div>
    </div>
  );
}
