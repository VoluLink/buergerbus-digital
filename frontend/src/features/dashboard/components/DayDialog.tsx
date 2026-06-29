import type { Dispatch, SetStateAction } from "react";
import { ChevronDown, ChevronUp, Clock3, Phone, Plus, X } from "lucide-react";

import { rideStatusMetadata } from "../../../config/rideStatusConfig";
import type { CalendarRide } from "../../../types/DashboardRide";
import { getRideTimeSummary } from "../utils/rideDisplayUtils";
import { normalizeName } from "../utils/nameUtils";
type DayRole = "dispo" | "fahrer";

const statusMetadata = rideStatusMetadata;

type DayDialogProps = {
  isOpen: boolean;
  dialogHeading: string;

  selectedDayRides: CalendarRide[];
  hasDriverDayView: boolean;
  dayRole: DayRole;
  setDayRole: Dispatch<SetStateAction<DayRole>>;
  isFahrer: boolean;

  isRideCrudRestricted: boolean;
  ridePendingDelete: CalendarRide | null;
  expandedRideIds: number[];
  collapsedDriverRideIds: number[];
  currentDriverDisplayName: string;

  closeDayDialog: () => void;
  openRideDialogForSelection: () => void;
  openEditRideDialog: (ride: CalendarRide) => void;
  requestDeleteRide: (ride: CalendarRide) => void;
  cancelDeleteRide: () => void;
  confirmDeleteRide: () => void | Promise<void>;

  toggleRideExpanded: (rideId: number) => void;
  toggleDriverRideCollapsed: (rideId: number) => void;
  toggleDriverSelfAssignment: (ride: CalendarRide) => void | Promise<void>;
  canToggleDriverAssignment: (ride: CalendarRide) => boolean;
  canManagePassengerChecks: (ride: CalendarRide) => boolean;
  togglePassengerCompleted: (
    passengerId: number,
    checked: boolean,
  ) => void | Promise<void>;
};

export function DayDialog({
  isOpen,
  dialogHeading,
  selectedDayRides,
  hasDriverDayView,
  dayRole,
  setDayRole,
  isFahrer,
  isRideCrudRestricted,
  ridePendingDelete,
  expandedRideIds,
  collapsedDriverRideIds,
  currentDriverDisplayName,
  closeDayDialog,
  openRideDialogForSelection,
  openEditRideDialog,
  requestDeleteRide,
  cancelDeleteRide,
  confirmDeleteRide,
  toggleRideExpanded,
  toggleDriverRideCollapsed,
  toggleDriverSelfAssignment,
  canToggleDriverAssignment,
  canManagePassengerChecks,
  togglePassengerCompleted,
}: DayDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={closeDayDialog}
    >
      <section
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-[0_35px_80px_rgba(15,23,42,0.4)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bg-[#0053a0] px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {dialogHeading}
              </h2>
              <p className="mt-1 text-base text-white/80">
                {selectedDayRides.length} Fahrten
              </p>
            </div>

            <div className="flex items-center gap-4">
              {!hasDriverDayView ? (
                <div className="inline-flex rounded-2xl bg-white/20 p-1">
                  <button
                    type="button"
                    className="rounded-xl bg-white px-4 py-1.5 text-sm font-semibold text-slate-700"
                    disabled
                  >
                    Übersicht
                  </button>
                </div>
              ) : isFahrer ? (
                <div className="inline-flex rounded-2xl bg-white/20 p-1">
                  <button
                    type="button"
                    className="rounded-xl bg-white px-4 py-1.5 text-sm font-semibold text-slate-700"
                    disabled
                  >
                    Fahrer
                  </button>
                </div>
              ) : (
                <div className="inline-flex rounded-2xl bg-white/20 p-1">
                  <button
                    type="button"
                    onClick={() => setDayRole("dispo")}
                    className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition ${
                      dayRole === "dispo"
                        ? "bg-white text-slate-700"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    Dispo
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayRole("fahrer")}
                    className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition ${
                      dayRole === "fahrer"
                        ? "bg-white text-slate-700"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    Fahrer
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={closeDayDialog}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
                aria-label="Dialog schliessen"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <div className="relative h-[460px] overflow-y-auto px-5 py-5 sm:px-8">
          {selectedDayRides.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-slate-400">
              <p className="text-4xl font-medium text-slate-400">
                Keine Fahrten an diesem Tag
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayRides.map((ride) => (
                <article
                  key={ride.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  {dayRole === "fahrer" && ride.type !== "rental" ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-3xl font-semibold tracking-tight text-slate-800">
                            {ride.title}
                          </h3>
                          <p className="mt-1 text-lg text-slate-500">
                            {getRideTimeSummary(ride)}
                            <span className="mx-2 text-slate-300">•</span>
                            {ride.passengers.length} Fahrgäste
                            {ride.driverName ? (
                              <>
                                <span className="mx-2 text-slate-300">•</span>
                                {ride.driverName}
                              </>
                            ) : null}
                            {ride.createdByName ? (
                              <>
                                <span className="mx-2 text-slate-300">•</span>
                                Erstellt von {ride.createdByName}
                              </>
                            ) : null}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-xl px-3 py-1 text-sm font-semibold text-white ${statusMetadata[ride.status].color}`}
                          >
                            {statusMetadata[ride.status].label}
                          </span>
                          {canToggleDriverAssignment(ride) ? (
                            <button
                              type="button"
                              onClick={() =>
                                void toggleDriverSelfAssignment(ride)
                              }
                              className={`rounded-xl px-3 py-1 text-sm font-semibold transition ${
                                (ride.status === "assigned" ||
                                  ride.status === "theme") &&
                                normalizeName(ride.driverName) ===
                                  normalizeName(currentDriverDisplayName)
                                  ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  : "bg-[#0053a0] text-white hover:brightness-105"
                              }`}
                            >
                              {(ride.status === "assigned" ||
                                ride.status === "theme") &&
                              normalizeName(ride.driverName) ===
                                normalizeName(currentDriverDisplayName)
                                ? "Abmelden"
                                : "Anmelden"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => toggleDriverRideCollapsed(ride.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                            aria-label={
                              collapsedDriverRideIds.includes(ride.id)
                                ? "Fahrt einklappen"
                                : "Fahrt ausklappen"
                            }
                          >
                            {collapsedDriverRideIds.includes(ride.id) ? (
                              <ChevronUp
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            ) : (
                              <ChevronDown
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        </div>
                      </div>

                      {collapsedDriverRideIds.includes(ride.id) ? (
                        <div className="mt-4 space-y-3 border-t border-slate-200 pt-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Bemerkungen
                            </div>
                            <div className="mt-2 whitespace-pre-line text-base leading-7 text-slate-700">
                              {ride.remarks || "-"}
                            </div>
                          </div>
                          {ride.passengers.length > 0 ? (
                            ride.passengers.map((passenger, passengerIndex) => {
                              const canEditChecks =
                                canManagePassengerChecks(ride);

                              return (
                                <div
                                  key={passenger.id}
                                  className={`rounded-2xl border border-slate-200 bg-white p-3 transition ${passenger.istAbgehakt ? "opacity-70" : ""}`}
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <label className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-800">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(passenger.istAbgehakt)}
                                        disabled={!canEditChecks}
                                        onChange={(event) =>
                                          void togglePassengerCompleted(
                                            passenger.id,
                                            event.target.checked,
                                          )
                                        }
                                        className={`h-6 w-6 rounded-md border-slate-300 ${canEditChecks ? "" : "cursor-not-allowed opacity-50"}`}
                                      />
                                      <span
                                        className={
                                          passenger.istAbgehakt
                                            ? "line-through text-slate-400"
                                            : ""
                                        }
                                      >
                                        {passenger.name ||
                                          `Fahrgast ${passengerIndex + 1}`}
                                      </span>
                                    </label>
                                    <span className="inline-flex items-center gap-1 rounded-xl bg-[#0053a0]/12 px-3 py-1 text-sm font-semibold text-[#0053a0]">
                                      <Clock3
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      />
                                      {passenger.time || "-"} Uhr
                                    </span>
                                  </div>

                                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        Abholung
                                      </div>
                                      <div className="mt-1 text-lg font-medium text-slate-800">
                                        {passenger.pickupAddress || "-"}
                                      </div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        Ziel
                                      </div>
                                      <div className="mt-1 text-lg font-medium text-slate-800">
                                        {passenger.destinationAddress || "-"}
                                      </div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        <Phone
                                          className="h-3.5 w-3.5"
                                          aria-hidden="true"
                                        />
                                        Telefon
                                      </div>
                                      <div className="mt-1 text-lg font-medium text-slate-800">
                                        {passenger.phone || "-"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-slate-500">
                              Keine Fahrgäste hinterlegt.
                            </p>
                          )}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl font-semibold text-slate-800">
                            {ride.title}
                          </h3>
                          <p className="mt-1 text-base text-slate-500">
                            {getRideTimeSummary(ride)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-xl px-3 py-1 text-sm font-semibold text-white ${statusMetadata[ride.status].color}`}
                        >
                          {statusMetadata[ride.status].label}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <div>
                          <span className="font-semibold text-slate-700">
                            Fahrtart:
                          </span>{" "}
                          {ride.type === "theme"
                            ? "Themenfahrt"
                            : ride.type === "rental"
                              ? "Vermietung"
                              : "Standardfahrt"}
                        </div>
                        {ride.type !== "rental" ? (
                          <>
                            <div>
                              <span className="font-semibold text-slate-700">
                                Fahrgäste:
                              </span>{" "}
                              {ride.passengers.length}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">
                                Fahrer:
                              </span>{" "}
                              {ride.driverName || "-"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">
                                Geschätzte Endzeit:
                              </span>{" "}
                              {ride.endTime || "-"}
                            </div>
                          </>
                        ) : null}
                        <div>
                          <span className="font-semibold text-slate-700">
                            Erstellt von:
                          </span>{" "}
                          {ride.createdByName || "-"}
                        </div>
                        <div className="sm:col-span-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Bemerkungen
                            </div>
                            <div className="mt-2 whitespace-pre-line text-base leading-7 text-slate-700">
                              {ride.remarks || "-"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {ride.type !== "rental" ? (
                        <div className="mt-3 border-t border-slate-200 pt-3">
                          <button
                            type="button"
                            onClick={() => toggleRideExpanded(ride.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            {expandedRideIds.includes(ride.id) ? (
                              <ChevronUp
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <ChevronDown
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            )}
                            {expandedRideIds.includes(ride.id)
                              ? "Gäste ausblenden"
                              : "Alle Gäste anzeigen"}
                          </button>

                          {expandedRideIds.includes(ride.id) ? (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <h4 className="text-sm font-semibold text-slate-700">
                                Fahrgäste
                              </h4>
                              {ride.passengers.length > 0 ? (
                                <ul className="mt-2 space-y-2">
                                  {ride.passengers.map(
                                    (passenger, passengerIndex) => (
                                      <li
                                        key={passenger.id}
                                        className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700"
                                      >
                                        <div className="font-semibold text-slate-800">
                                          {passenger.name ||
                                            `Fahrgast ${passengerIndex + 1}`}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                          Telefon: {passenger.phone || "-"} |
                                          Abholung:{" "}
                                          {passenger.pickupAddress || "-"} |
                                          Ziel:{" "}
                                          {passenger.destinationAddress || "-"}{" "}
                                          | Zeit: {passenger.time || "-"}
                                        </div>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <p className="mt-2 text-sm text-slate-500">
                                  Keine Fahrgäste hinterlegt.
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {!(isFahrer && ride.type === "rental") ? (
                        <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-3">
                          <button
                            type="button"
                            onClick={() => requestDeleteRide(ride)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Löschen
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditRideDialog(ride)}
                            className="rounded-xl bg-[#0053a0] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                          >
                            Bearbeiten
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </article>
              ))}
            </div>
          )}

          {!isRideCrudRestricted ? (
            <button
              type="button"
              onClick={openRideDialogForSelection}
              className="sticky bottom-4 ml-auto mt-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0053a0] text-white shadow-[0_14px_30px_rgba(0,83,160,0.45)] transition hover:brightness-110"
              aria-label="Neue Fahrt erstellen"
            >
              <Plus className="h-7 w-7" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {ridePendingDelete ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
              <h3 className="text-xl font-semibold text-slate-800">
                Fahrt wirklich löschen?
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Die Fahrt{" "}
                <span className="font-semibold text-slate-800">
                  {ridePendingDelete.title}
                </span>{" "}
                wird dauerhaft aus dem Kalender entfernt.
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelDeleteRide}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteRide}
                  disabled={isRideCrudRestricted}
                  className="rounded-xl border border-rose-200 bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  Endgültig löschen
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
