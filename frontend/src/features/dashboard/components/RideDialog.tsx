import type { Dispatch, SetStateAction } from "react";
import {
  AlertTriangle,
  Bus,
  MapPin,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { FiveMinuteTimeField } from "./FiveMinuteTimeField";

import type { RideFormState } from "../types/rideFormTypes";
import type { RideStatus, RideType } from "../../../types/DashboardRide";
import type { Fahrgast } from "../../../types/Fahrgast";
import type { FahrerListItem } from "../../../types/FahrerListItem";
import type { Fahrzeug } from "../../../types/Fahrzeug";

import { RentalRideForm } from "./ride-dialog/RentalRideForm";
import { RideTypeTabs } from "./ride-dialog/RideTypeTabs";

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
            <div className="mt-6 rounded-2xl border border-[#0053a0]/25 bg-[#0053a0]/8 p-4">
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="theme-title"
              >
                Thema / Titel
              </label>
              <input
                id="theme-title"
                type="text"
                value={activeRideForm?.themeTitle ?? ""}
                onChange={(event) =>
                  updateRideField("themeTitle", event.target.value)
                }
                placeholder="z. B. Weihnachtsmarkt-Tour"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
              />
              <label
                className="mt-4 block text-sm font-semibold text-slate-700"
                htmlFor="theme-destination"
              >
                Zieladresse
              </label>
              <input
                id="theme-destination"
                type="text"
                value={activeRideForm?.themeDestination ?? ""}
                onChange={(event) =>
                  updateRideField("themeDestination", event.target.value)
                }
                placeholder="z. B. Marktplatz 1, Frankfurt"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
              />
            </div>
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
                  onChange={(event) =>
                    autofillFahrzeug(Number(event.target.value))
                  }
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
                  <UserRound
                    className="h-4 w-4 text-[#0053a0]"
                    aria-hidden="true"
                  />
                  Fahrer (max. 1)
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
                {(activeRideForm?.driverName ?? "").trim().length > 0 ? (
                  <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    {fahrerListe
                      .filter((driver) => {
                        const query = (activeRideForm?.driverName ?? "")
                          .trim()
                          .toLowerCase();

                        const searchable =
                          `${driver.name} ${driver.telefonnummer ?? ""}`.toLowerCase();

                        return searchable.includes(query);
                      })
                      .slice(0, 6)
                      .map((driver) => (
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
                  onChange={(nextValue) =>
                    updateRideField("endTime", nextValue)
                  }
                />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users
                      className="h-4 w-4 text-[#0053a0]"
                      aria-hidden="true"
                    />
                    {rideType === "theme"
                      ? `Fahrgäste Themenfahrt (max. ${maxPassengersForActiveRide || "Fahrzeugkapazität"})`
                      : `Fahrgäste (max. ${maxPassengersForActiveRide || "Fahrzeugkapazität"})`}
                  </p>
                </div>

                <div className="space-y-3">
                  {activeRideForm?.passengers.map(
                    (passenger, passengerIndex) => (
                      <div
                        key={passenger.id}
                        className="rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Fahrgast {passengerIndex + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => removePassengerField(passenger.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            <Trash2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Entfernen
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="relative sm:col-span-2">
                            <input
                              type="text"
                              value={passenger.name ?? ""}
                              onChange={(event) =>
                                updatePassengerField(
                                  passenger.id,
                                  "name",
                                  event.target.value,
                                )
                              }
                              placeholder="Name des Fahrgasts (z. B. Max)"
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                            />

                            {(passenger.name ?? "").trim().length > 0 ? (
                              <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                {knownGuests
                                  .filter((guest) => guest.aktiv)
                                  .filter((guest) => {
                                    const query = (passenger.name ?? "")
                                      .trim()
                                      .toLowerCase();
                                    const searchable =
                                      `${guest.vorname ?? ""} ${guest.nachname ?? ""} ${guest.adresse ?? ""} ${guest.telefonnummer ?? ""}`.toLowerCase();
                                    return searchable.includes(query);
                                  })
                                  .slice(0, 6)
                                  .map((guest) => (
                                    <button
                                      key={guest.id}
                                      type="button"
                                      onClick={() =>
                                        autofillPassengerFromKnownGuest(
                                          passenger.id,
                                          guest.id,
                                        )
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
                                  updatePassengerSaveAsGuest(
                                    passenger.id,
                                    event.target.checked,
                                  )
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
                              updatePassengerField(
                                passenger.id,
                                "phone",
                                event.target.value,
                              )
                            }
                            placeholder="Telefonnummer"
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/15"
                          />
                          <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-500">
                            <MapPin
                              className="h-4 w-4 text-[#0053a0]"
                              aria-hidden="true"
                            />
                            <input
                              type="text"
                              value={passenger.pickupAddress ?? ""}
                              onChange={(event) =>
                                updatePassengerField(
                                  passenger.id,
                                  "pickupAddress",
                                  event.target.value,
                                )
                              }
                              placeholder="Abholadresse"
                              className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                            />
                          </label>
                          {rideType === "theme" ? null : (
                            <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-500">
                              <MapPin
                                className="h-4 w-4 text-[#2f73b3]"
                                aria-hidden="true"
                              />
                              <input
                                type="text"
                                value={passenger.destinationAddress ?? ""}
                                onChange={(event) =>
                                  updatePassengerField(
                                    passenger.id,
                                    "destinationAddress",
                                    event.target.value,
                                  )
                                }
                                placeholder="Zieladresse"
                                className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                              />
                            </label>
                          )}
                          <label className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-500">
                            <FiveMinuteTimeField
                              value={passenger.time ?? ""}
                              onChange={(nextValue) =>
                                updatePassengerField(
                                  passenger.id,
                                  "time",
                                  nextValue,
                                )
                              }
                              wrapperClassName="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"
                              fieldClassName="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none"
                            />
                          </label>
                        </div>
                      </div>
                    ),
                  )}

                  {(activeRideForm?.passengers.length ?? 0) === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Noch keine Fahrgäste hinzugefügt.
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex justify-start">
                  <button
                    type="button"
                    onClick={addPassengerField}
                    disabled={
                      selectedRideVehicle == null || isPassengerLimitReached
                    }
                    className="rounded-xl bg-[#0053a0]/12 px-3 py-1.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + Fahrgast hinzufügen
                  </button>
                </div>
              </div>
            </>
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
