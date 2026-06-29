import { Bell, ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react";

type CalendarView = "Monat" | "Woche" | "Tag";

type DashboardToolbarProps = {
  monthHeading: string;
  calendarViews: CalendarView[];
  selectedView: CalendarView;
  setSelectedView: (view: CalendarView) => void;
  shiftPeriod: (amount: number) => void;
  isAdmin: boolean;
  isRideCrudRestricted: boolean;
  openNotifications: () => void;
  openSettings: () => void;
  openRideDialogForSelection: () => void;
};

export function DashboardToolbar({
  monthHeading,
  calendarViews,
  selectedView,
  setSelectedView,
  shiftPeriod,
  isAdmin,
  isRideCrudRestricted,
  openNotifications,
  openSettings,
  openRideDialogForSelection,
}: DashboardToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-5 sm:pb-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl lg:text-5xl">
        {monthHeading}
      </h1>

      <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:gap-3">
        <div className="grid min-h-11 flex-1 grid-cols-3 rounded-2xl bg-slate-100 p-1 sm:inline-flex sm:flex-none">
          {calendarViews.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setSelectedView(view)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                selectedView === view
                  ? "bg-white text-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => shiftPeriod(-1)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:h-10 sm:w-10"
          aria-label="Vorheriger Zeitraum"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => shiftPeriod(1)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:h-10 sm:w-10"
          aria-label="Naechster Zeitraum"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>

        {isAdmin ? (
          <button
            type="button"
            onClick={openNotifications}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#0053a0]/20 bg-[#0053a0]/5 px-3 py-2.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/10 sm:flex-none sm:px-4"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            Benachrichtigungen
          </button>
        ) : null}

        {isAdmin ? (
          <button
            type="button"
            onClick={openSettings}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#0053a0]/20 bg-[#0053a0]/5 px-3 py-2.5 text-sm font-semibold text-[#0053a0] transition hover:bg-[#0053a0]/10 sm:flex-none sm:px-4"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Einstellungen
          </button>
        ) : null}

        {!isRideCrudRestricted ? (
          <button
            type="button"
            onClick={openRideDialogForSelection}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0053a0] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,83,160,0.35)] transition hover:brightness-105 sm:flex-none sm:px-5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Fahrt
          </button>
        ) : null}
      </div>
    </div>
  );
}
