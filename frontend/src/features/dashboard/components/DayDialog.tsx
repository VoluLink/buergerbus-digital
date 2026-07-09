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
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:p-4"
      onClick={closeDayDialog}
    >
      <section
        className="relative flex h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_35px_80px_rgba(15,23,42,0.4)] sm:h-auto sm:max-h-[calc(100dvh-2rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 bg-[#0053a0] px-4 py-4 text-white sm:px-8 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-start justify-between gap-3 sm:flex-1">
              <div className="min-w-0">
                <h2 className="break-words text-2xl font-semibold tracking-tight leading-tight sm:text-4xl">
                  {dialogHeading}
                </h2>
                <p className="mt-1 text-sm text-white/80 sm:text-base">
                  {selectedDayRides.length} Fahrten
                </p>
              </div>

              <button
                type="button"
                onClick={closeDayDialog}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
                aria-label="Dialog schliessen"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
              {!hasDriverDayView ? (
                <div className="inline-flex w-full rounded-2xl bg-white/20 p-1 sm:w-auto">
                  <button
                    type="button"
                    className="min-h-10 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto"
                    disabled
                  >
                    Übersicht
                  </button>
                </div>
              ) : isFahrer ? (
                <div className="inline-flex w-full rounded-2xl bg-white/20 p-1 sm:w-auto">
                  <button
                    type="button"
                    className="min-h-10 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto"
                    disabled
                  >
                    Fahrer
                  </button>
                </div>
              ) : (
                <div className="inline-flex w-full flex-wrap gap-2 rounded-2xl bg-white/20 p-1 sm:w-auto sm:gap-0">
                  <button
                    type="button"
                    onClick={() => setDayRole("dispo")}
                    className={`min-h-10 flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:flex-none ${
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
                    className={`min-h-10 flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                      dayRole === "fahrer"
                        ? "bg-white text-slate-700"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    Fahrer
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:h-[460px] sm:flex-none sm:px-8 sm:py-5">
          {selectedDayRides.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-slate-400">
              <p className="text-2xl font-medium text-slate-400 sm:text-4xl">
                Keine Fahrten an diesem Tag
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayRides.map((ride) => (
                <article
                  key={ride.id}
                  className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4"
                >
                  {dayRole === "fahrer" && ride.type !== "rental" ? (
                    <>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
                            {ride.title}
                          </h3>
                          <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm leading-6 text-slate-500 sm:text-lg">
                            <span className="break-words">
                              {getRideTimeSummary(ride)}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="break-words">
                              {ride.passengers.length} Fahrgäste
                            </span>
                            {ride.driverName ? (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="break-all">
                                  {ride.driverName}
                                </span>
                              </>
                            ) : null}
                            {ride.createdByName ? (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="break-all">
                                  Erstellt von {ride.createdByName}
                                </span>
                              </>
                            ) : null}
                          </p>
                        </div>

                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                          <span
                            className={`inline-flex max-w-full items-center rounded-xl px-3 py-1 text-center text-sm font-semibold leading-tight text-white break-words ${statusMetadata[ride.status].color}`}
                          >
                            {statusMetadata[ride.status].label}
                          </span>
                          {canToggleDriverAssignment(ride) ? (
                            <button
                              type="button"
                              onClick={() =>
                                void toggleDriverSelfAssignment(ride)
                              }
                              className={`min-h-10 rounded-xl px-3 py-2 text-sm font-semibold transition ${
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
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 sm:h-8 sm:w-8"
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
                            <div className="mt-2 break-words whitespace-pre-line text-base leading-7 text-slate-700">
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
                                  className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-3 transition ${passenger.istAbgehakt ? "opacity-70" : ""}`}
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <label className="inline-flex min-w-0 items-start gap-2 text-lg font-semibold text-slate-800 sm:text-2xl">
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
                                        className={`min-w-0 break-words ${
                                          passenger.istAbgehakt
                                            ? "line-through text-slate-400"
                                            : ""
                                        }`}
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
                                    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2">
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        Abholung
                                      </div>
                                      <div className="mt-1 break-words text-lg font-medium text-slate-800">
                                        {passenger.pickupAddress || "-"}
                                      </div>
                                    </div>
                                    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2">
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        Ziel
                                      </div>
                                      <div className="mt-1 break-words text-lg font-medium text-slate-800">
                                        {passenger.destinationAddress || "-"}
                                      </div>
                                    </div>
                                    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2">
                                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        <Phone
                                          className="h-3.5 w-3.5"
                                          aria-hidden="true"
                                        />
                                        Telefon
                                      </div>
                                      <div className="mt-1 break-all text-lg font-medium text-slate-800">
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
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-2xl font-semibold text-slate-800">
                            {ride.title}
                          </h3>
                          <p className="mt-1 break-words text-sm text-slate-500 sm:text-base">
                            {getRideTimeSummary(ride)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex max-w-full items-center rounded-xl px-3 py-1 text-center text-sm font-semibold leading-tight text-white break-words ${statusMetadata[ride.status].color}`}
                        >
                          {statusMetadata[ride.status].label}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <div className="min-w-0 break-words">
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
                            <div className="min-w-0 break-words">
                              <span className="font-semibold text-slate-700">
                                Fahrgäste:
                              </span>{" "}
                              {ride.passengers.length}
                            </div>
                            <div className="min-w-0 break-words">
                              <span className="font-semibold text-slate-700">
                                Fahrer:
                              </span>{" "}
                              {ride.driverName || "-"}
                            </div>
                            <div className="min-w-0 break-words">
                              <span className="font-semibold text-slate-700">
                                Geschätzte Endzeit:
                              </span>{" "}
                              {ride.endTime || "-"}
                            </div>
                          </>
                        ) : null}
                        <div className="min-w-0 break-words">
                          <span className="font-semibold text-slate-700">
                            Erstellt von:
                          </span>{" "}
                          {ride.createdByName || "-"}
                        </div>
                        <div className="sm:col-span-2">
                          <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Bemerkungen
                            </div>
                            <div className="mt-2 break-words whitespace-pre-line text-base leading-7 text-slate-700">
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
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
                                        className="min-w-0 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700"
                                      >
                                        <div className="break-words font-semibold text-slate-800">
                                          {passenger.name ||
                                            `Fahrgast ${passengerIndex + 1}`}
                                        </div>
                                        <div className="mt-1 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1">
                                          <span className="break-words">
                                            Telefon: {passenger.phone || "-"}
                                          </span>
                                          <span className="hidden text-slate-300 sm:inline">
                                            |
                                          </span>
                                          <span className="break-words">
                                            Abholung:{" "}
                                            {passenger.pickupAddress || "-"}
                                          </span>
                                          <span className="hidden text-slate-300 sm:inline">
                                            |
                                          </span>
                                          <span className="break-words">
                                            Ziel:{" "}
                                            {passenger.destinationAddress ||
                                              "-"}
                                          </span>
                                          <span className="hidden text-slate-300 sm:inline">
                                            |
                                          </span>
                                          <span className="break-words">
                                            Zeit: {passenger.time || "-"}
                                          </span>
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
              className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] mr-1 ml-auto mt-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0053a0] text-white shadow-[0_14px_30px_rgba(0,83,160,0.45)] transition hover:brightness-110 sm:bottom-4 sm:mr-0"
              aria-label="Neue Fahrt erstellen"
            >
              <Plus className="h-7 w-7" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {ridePendingDelete ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/45 p-2 backdrop-blur-[2px] sm:p-4">
            <section className="max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:pb-5">
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

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelDeleteRide}
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteRide}
                  disabled={isRideCrudRestricted}
                  className="min-h-11 rounded-xl border border-rose-200 bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
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
