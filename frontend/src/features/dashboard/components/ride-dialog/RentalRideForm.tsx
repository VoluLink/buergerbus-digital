import type { Dispatch, SetStateAction } from "react";
import { Bus } from "lucide-react";

import { FiveMinuteTimeField } from "../FiveMinuteTimeField";

import type { Fahrzeug } from "../../../../types/Fahrzeug";

type RentalRideFormProps = {
  rentalName: string;
  setRentalName: Dispatch<SetStateAction<string>>;

  rentalVehicleId: number | null;
  visibleFahrzeuge: Fahrzeug[];
  autofillFahrzeug: (selectedFahrzeugId: number) => void;

  rentalDateFrom: string;
  setRentalDateFrom: Dispatch<SetStateAction<string>>;

  rentalDateTo: string;
  setRentalDateTo: Dispatch<SetStateAction<string>>;

  rentalTimeFrom: string;
  setRentalTimeFrom: Dispatch<SetStateAction<string>>;

  rentalTimeTo: string;
  setRentalTimeTo: Dispatch<SetStateAction<string>>;
};

export function RentalRideForm({
  rentalName,
  setRentalName,
  rentalVehicleId,
  visibleFahrzeuge,
  autofillFahrzeug,
  rentalDateFrom,
  setRentalDateFrom,
  rentalDateTo,
  setRentalDateTo,
  rentalTimeFrom,
  setRentalTimeFrom,
  rentalTimeTo,
  setRentalTimeTo,
}: RentalRideFormProps) {
  return (
    <div className="mt-6 rounded-2xl border border-[#0053a0]/25 bg-[#0053a0]/8 p-4">
      <label
        htmlFor="rental-name"
        className="block text-sm font-semibold text-slate-700"
      >
        Name
      </label>

      <input
        id="rental-name"
        type="text"
        value={rentalName}
        onChange={(event) => setRentalName(event.target.value)}
        placeholder="Name der Vermietung"
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
      />

      <div className="mt-4">
        <label
          htmlFor="rental-vehicle"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          <Bus className="h-4 w-4 text-[#0053a0]" aria-hidden="true" />
          Fahrzeug
        </label>

        <select
          id="rental-vehicle"
          value={rentalVehicleId ?? ""}
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Datum von
          <input
            type="date"
            value={rentalDateFrom}
            onChange={(event) => setRentalDateFrom(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none"
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Datum bis
          <input
            type="date"
            value={rentalDateTo}
            onChange={(event) => setRentalDateTo(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none"
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Uhrzeit von
          <FiveMinuteTimeField
            value={rentalTimeFrom}
            onChange={setRentalTimeFrom}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Uhrzeit bis
          <FiveMinuteTimeField
            value={rentalTimeTo}
            onChange={setRentalTimeTo}
          />
        </label>
      </div>
    </div>
  );
}
