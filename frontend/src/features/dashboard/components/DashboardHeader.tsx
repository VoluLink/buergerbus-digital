import { CircleUserRound, Menu } from "lucide-react";

import UserMenuButton from "../../../components/UserMenuButton";
import type { Initiative } from "../../../types/Initiative";

type DashboardHeaderProps = {
  visibleTopFilters: string[];
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;

  canManageInitiatives: boolean;
  selectedInitiativeId: number | null;
  setSelectedInitiativeId: (initiativeId: number | null) => void;
  initiativeListe: Initiative[];

  openSideMenu: () => void;
  openProfile: () => void;
};

export function DashboardHeader({
  visibleTopFilters,
  selectedFilter,
  setSelectedFilter,
  canManageInitiatives,
  selectedInitiativeId,
  setSelectedInitiativeId,
  initiativeListe,
  openSideMenu,
  openProfile,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openSideMenu}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/40"
            aria-label="Navigation öffnen"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          {visibleTopFilters.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {visibleTopFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${
                    selectedFilter === filter
                      ? "bg-slate-800 text-white shadow-[0_10px_25px_rgba(15,23,42,0.2)]"
                      : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          ) : null}

          {canManageInitiatives ? (
            <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
              Initiative
              <select
                value={selectedInitiativeId ?? ""}
                onChange={(event) =>
                  setSelectedInitiativeId(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
              >
                {initiativeListe.length > 0 ? (
                  initiativeListe.map((initiative) => (
                    <option key={initiative.id} value={initiative.id}>
                      {initiative.name}
                    </option>
                  ))
                ) : (
                  <option value="">Alle</option>
                )}
              </select>
            </label>
          ) : null}
        </div>

        <UserMenuButton
          onClick={openProfile}
          icon={<CircleUserRound className="h-6 w-6" aria-hidden="true" />}
        />
      </div>
    </header>
  );
}
