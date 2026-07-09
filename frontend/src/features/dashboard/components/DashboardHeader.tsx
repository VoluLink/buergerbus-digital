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
    <header className="border-b border-slate-200 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur sm:px-6 sm:py-3">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-4">
        <button
          type="button"
          onClick={openSideMenu}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053a0]/40 sm:h-11 sm:w-11"
          aria-label="Navigation oeffnen"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {visibleTopFilters.length > 0 ? (
          <div className="order-3 flex w-full flex-wrap gap-1 sm:order-none sm:w-auto sm:gap-2">
            {visibleTopFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`min-h-9 flex-1 rounded-2xl px-2.5 py-1.5 text-xs font-semibold transition sm:min-h-10 sm:flex-none sm:px-5 sm:py-2 sm:text-sm ${
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
          <label className="order-4 inline-flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 sm:order-none sm:w-auto sm:py-2">
            Initiative
            <select
              value={selectedInitiativeId ?? ""}
              onChange={(event) =>
                setSelectedInitiativeId(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none sm:flex-none sm:py-2"
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

        <UserMenuButton
          onClick={openProfile}
          className="order-2 ml-auto flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-1 text-left transition hover:bg-slate-50 sm:order-none sm:gap-3 sm:px-3 sm:py-2"
          icon={
            <CircleUserRound
              className="h-5 w-5 sm:h-6 sm:w-6"
              aria-hidden="true"
            />
          }
        />
      </div>
    </header>
  );
}
