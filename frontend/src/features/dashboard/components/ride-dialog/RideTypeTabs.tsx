import { Sparkles } from "lucide-react";

import { rideTypeButtonClassName } from "../../utils/rideDisplayUtils";

import type { RideType } from "../../../../types/DashboardRide";

type RideTypeTabsProps = {
  rideType: RideType;
  onRideTypeChange: (rideType: RideType) => void;
};

export function RideTypeTabs({
  rideType,
  onRideTypeChange,
}: RideTypeTabsProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Fahrtart
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onRideTypeChange("standard")}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${rideTypeButtonClassName(
            rideType,
            "standard",
          )}`}
        >
          Standardfahrt
        </button>

        <button
          type="button"
          onClick={() => onRideTypeChange("theme")}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${rideTypeButtonClassName(
            rideType,
            "theme",
          )}`}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Themenfahrt
        </button>

        <button
          type="button"
          onClick={() => onRideTypeChange("rental")}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${rideTypeButtonClassName(
            rideType,
            "rental",
          )}`}
        >
          Vermietung
        </button>
      </div>
    </div>
  );
}
