import type { RideFormState } from "../../types/rideFormTypes";
import { AddressAutocomplete } from "../../../../components/AddressAutocomplete";

type ThemeRideFormProps = {
  activeRideForm: RideFormState | null;
  updateRideField: (
    field: keyof Omit<RideFormState, "passengers">,
    value: string,
  ) => void;
};

export function ThemeRideForm({
  activeRideForm,
  updateRideField,
}: ThemeRideFormProps) {
  return (
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
        onChange={(event) => updateRideField("themeTitle", event.target.value)}
        placeholder="z. B. Weihnachtsmarkt-Tour"
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-4 focus:ring-[#0053a0]/15"
      />

      <label
        className="mt-4 block text-sm font-semibold text-slate-700"
        htmlFor="theme-destination"
      >
        Zieladresse
      </label>

      <AddressAutocomplete
        id="theme-destination"
        value={activeRideForm?.themeDestination ?? ""}
        onChange={(value) => updateRideField("themeDestination", value)}
        placeholder="z. B. Marktplatz 1, Frankfurt"
        className="mt-2 py-3 pl-9 focus:ring-4"
      />
    </div>
  );
}
