import type { Dispatch, SetStateAction } from "react";
import { AlertTriangle, X } from "lucide-react";

import type { RideFormState } from "../types/rideFormTypes";
import type { RideStatus, RideType } from "../../../types/DashboardRide";
import type { Fahrgast } from "../../../types/Fahrgast";
import type { FahrerListItem } from "../../../types/FahrerListItem";
import type { Fahrzeug } from "../../../types/Fahrzeug";

import { RentalRideForm } from "./ride-dialog/RentalRideForm";
import { RideTypeTabs } from "./ride-dialog/RideTypeTabs";
import { ThemeRideForm } from "./ride-dialog/ThemeRideForm";
import { RegularRideForm } from "./ride-dialog/RegularRideForm";

type RideDialogProps = {
  isOpen: boolean;
  isRideCrudRestricted: boolean;
  rideInEditId: number | null;
  dialogHeading: string;

  rideType: RideType;
  setRideType: Dispatch<SetStateAction<RideType>>;
  activeRideForm: RideFormState | null;

  rideSaveError: string | null;
  rideCapacityWarning: string | null;
  closeRideDialog: () => void;

  visibleFahrzeuge: Fahrzeug[];
  fahrerListe: FahrerListItem[];
  knownGuests: Fahrgast[];

  rentalName: string;
  setRentalName: Dispatch<SetStateAction<string>>;
  rentalDateFrom: string;
  setRentalDateFrom: Dispatch<SetStateAction<string>>;
  rentalDateTo: string;
  setRentalDateTo: Dispatch<SetStateAction<string>>;
  rentalTimeFrom: string;
  setRentalTimeFrom: Dispatch<SetStateAction<string>>;
  rentalTimeTo: string;
  setRentalTimeTo: Dispatch<SetStateAction<string>>;
  rentalVehicleId: number | null;
  rentalRemarks: string;
  setRentalRemarks: Dispatch<SetStateAction<string>>;

  remarksPlaceholder: string;

  selectedRideVehicle: Fahrzeug | null;
  maxPassengersForActiveRide: number;
  isPassengerLimitReached: boolean;

  updateRideField: (
    field: keyof Omit<RideFormState, "passengers">,
    value: string,
  ) => void;

  updatePassengerField: (
    passengerId: number,
    field: keyof Omit<
      RideFormState["passengers"][number],
      "id" | "sourceGuestId" | "saveAsGuest"
    >,
    value: string | boolean,
  ) => void;

  autofillPassengerFromKnownGuest: (
    passengerId: number,
    selectedGuestId: number,
  ) => void;

  updatePassengerSaveAsGuest: (passengerId: number, value: boolean) => void;

  autofillFahrer: (selectedFahrerId: number) => void;
  autofillFahrzeug: (selectedFahrzeugId: number) => void;

  addPassengerField: () => void;
  removePassengerField: (passengerId: number) => void;

  saveRide: (statusOverride?: RideStatus) => void | Promise<void>;
};

export function RideDialog({
  isOpen,
  isRideCrudRestricted,
  rideInEditId,
  dialogHeading,
  rideType,
  setRideType,
  activeRideForm,
  rideSaveError,
  rideCapacityWarning,
  closeRideDialog,
  visibleFahrzeuge,
  fahrerListe,
  knownGuests,
  rentalName,
  setRentalName,
  rentalDateFrom,
  setRentalDateFrom,
  rentalDateTo,
  setRentalDateTo,
  rentalTimeFrom,
  setRentalTimeFrom,
  rentalTimeTo,
  setRentalTimeTo,
  rentalVehicleId,
  rentalRemarks,
  setRentalRemarks,
  remarksPlaceholder,
  selectedRideVehicle,
  maxPassengersForActiveRide,
  isPassengerLimitReached,
  updateRideField,
  updatePassengerField,
  autofillPassengerFromKnownGuest,
  updatePassengerSaveAsGuest,
  autofillFahrer,
  autofillFahrzeug,
  addPassengerField,
  removePassengerField,
  saveRide,
}: RideDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-3 backdrop-blur-sm sm:p-4">
      <section
        className="max-h-[96vh] w-full max-w-4xl overflow-hidden rounded-[1.75rem] bg-white shadow-[0_40px_100px_rgba(15,23,42,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bg-[#0053a0] px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight">
                {rideInEditId !== null
                  ? "Fahrt bearbeiten"
                  : "Neue Fahrt erstellen"}
              </h2>
              <p className="mt-2 text-base text-white/80">{dialogHeading}</p>
            </div>

            <button
              type="button"
              onClick={closeRideDialog}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/15"
              aria-label="Dialog schliessen"
            >
              <X className="h-7 w-7" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="max-h-[calc(96vh-170px)] overflow-y-auto px-6 py-6 sm:px-8">
          {rideSaveError ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {rideSaveError}
            </div>
          ) : null}

          {rideCapacityWarning ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{rideCapacityWarning}</span>
            </div>
          ) : null}

          <RideTypeTabs rideType={rideType} onRideTypeChange={setRideType} />

          {rideType === "theme" ? (
            <ThemeRideForm
              activeRideForm={activeRideForm}
              updateRideField={updateRideField}
            />
          ) : null}
          {rideType === "rental" ? (
            <RentalRideForm
              rentalName={rentalName}
              setRentalName={setRentalName}
              rentalVehicleId={rentalVehicleId}
              visibleFahrzeuge={visibleFahrzeuge}
              autofillFahrzeug={autofillFahrzeug}
              rentalDateFrom={rentalDateFrom}
              setRentalDateFrom={setRentalDateFrom}
              rentalDateTo={rentalDateTo}
              setRentalDateTo={setRentalDateTo}
              rentalTimeFrom={rentalTimeFrom}
              setRentalTimeFrom={setRentalTimeFrom}
              rentalTimeTo={rentalTimeTo}
              setRentalTimeTo={setRentalTimeTo}
            />
          ) : (
            <RegularRideForm
              rideType={rideType}
              activeRideForm={activeRideForm}
              visibleFahrzeuge={visibleFahrzeuge}
              fahrerListe={fahrerListe}
              knownGuests={knownGuests}
              selectedRideVehicle={selectedRideVehicle}
              maxPassengersForActiveRide={maxPassengersForActiveRide}
              isPassengerLimitReached={isPassengerLimitReached}
              updateRideField={updateRideField}
              updatePassengerField={updatePassengerField}
              autofillFahrer={autofillFahrer}
              autofillFahrzeug={autofillFahrzeug}
              autofillPassengerFromKnownGuest={autofillPassengerFromKnownGuest}
              updatePassengerSaveAsGuest={updatePassengerSaveAsGuest}
              addPassengerField={addPassengerField}
              removePassengerField={removePassengerField}
            />
          )}
          <div className="mt-6">
            <label
              htmlFor="ride-remarks"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <span className="inline-block h-3 w-3 rounded-sm border border-[#0053a0]" />
              Bemerkungen
            </label>
            <textarea
              id="ride-remarks"
              rows={4}
              value={
                rideType === "rental"
                  ? rentalRemarks
                  : (activeRideForm?.remarks ?? "")
              }
              onChange={(event) => {
                if (rideType === "rental") {
                  setRentalRemarks(event.target.value);
                  return;
                }

                updateRideField("remarks", event.target.value);
              }}
              placeholder={remarksPlaceholder}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
            />
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={closeRideDialog}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => saveRide("saved")}
            disabled={isRideCrudRestricted}
            className="rounded-2xl border border-[#0053a0]/30 bg-[#0053a0]/8 px-5 py-2.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/15"
          >
            {rideInEditId !== null ? "Änderung speichern" : "Fahrt Speichern"}
          </button>
          <button
            type="button"
            onClick={() => saveRide()}
            disabled={isRideCrudRestricted}
            className="rounded-2xl bg-[#0053a0] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
          >
            {rideInEditId !== null
              ? "Änderungen übernehmen"
              : "Fahrt erstellen"}
          </button>
        </footer>
      </section>
    </div>
  );
}
