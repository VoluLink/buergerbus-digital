import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

type CalendarView = "Monat" | "Woche" | "Tag";

type DashboardToolbarProps = {
  monthHeading: string;
  calendarViews: CalendarView[];
  selectedView: CalendarView;
  setSelectedView: (view: CalendarView) => void;
  shiftPeriod: (amount: number) => void;
  isRideCrudRestricted: boolean;
  openRideDialogForSelection: () => void;
};

export function DashboardToolbar({
  monthHeading,
  calendarViews,
  selectedView,
  setSelectedView,
  shiftPeriod,
  isRideCrudRestricted,
  openRideDialogForSelection,
}: DashboardToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-5 sm:pb-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl lg:text-5xl">
        {monthHeading}
      </h1>

      <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
        <div className="grid w-full grid-cols-3 rounded-2xl bg-slate-100 p-1 sm:w-auto sm:inline-flex">
          {calendarViews.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setSelectedView(view)}
              className={`min-h-11 min-w-0 rounded-xl px-2 py-2 text-sm font-semibold transition sm:min-h-10 sm:px-4 ${
                selectedView === view
                  ? "bg-white text-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
          <button
            type="button"
            onClick={() => shiftPeriod(-1)}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:h-10 sm:w-10"
            aria-label="Vorheriger Zeitraum"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => shiftPeriod(1)}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:h-10 sm:w-10"
            aria-label="Naechster Zeitraum"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
          {!isRideCrudRestricted ? (
            <button
              type="button"
              onClick={openRideDialogForSelection}
              className="col-span-full inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-2xl bg-[#0053a0] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,83,160,0.35)] transition hover:brightness-105 sm:col-span-auto sm:flex-none sm:px-5"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              Fahrt
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
