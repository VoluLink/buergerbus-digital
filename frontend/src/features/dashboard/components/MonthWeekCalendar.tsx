import { rideStatusMetadata } from "../../../config/rideStatusConfig";
import type { CalendarRide } from "../../../types/DashboardRide";
import type { CalendarDay } from "../utils/calendarViewUtils";
import { isSameDay, toDateKey } from "../utils/dateUtils";
import {
  getRideCalendarDisplayTime,
  getRideCalendarTitle,
} from "../utils/rideDisplayUtils";

type CalendarView = "Monat" | "Woche" | "Tag";

type MonthWeekCalendarProps = {
  activeCalendarDays: CalendarDay[];
  selectedView: CalendarView;
  selectedDate: Date;
  ridesByDay: Map<string, CalendarRide[]>;
  openDayDialog: (date: Date) => void;
};

const weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const statusMetadata = rideStatusMetadata;

export function MonthWeekCalendar({
  activeCalendarDays,
  selectedView,
  selectedDate,
  ridesByDay,
  openDayDialog,
}: MonthWeekCalendarProps) {
  return (
    <>
      <div className="mt-5 grid grid-cols-7 gap-2 text-center text-sm font-semibold text-slate-500">
        {weekDays.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid gap-2 grid-cols-1 sm:grid-cols-7">
        {activeCalendarDays.map((day) => {
          const isSelected = isSameDay(day.date, selectedDate);
          const dayLabel = day.date.getDate().toString();
          const ridesForDay = ridesByDay.get(toDateKey(day.date)) ?? [];
          const visibleMarkers = ridesForDay.slice(0, 3);

          return (
            <button
              key={day.date.toISOString()}
              type="button"
              onClick={() => openDayDialog(day.date)}
              className={`flex flex-col justify-between rounded-xl border px-3 py-2 text-left transition ${
                selectedView === "Monat"
                  ? "h-20 sm:h-22 lg:h-24"
                  : "min-h-28 sm:min-h-32"
              } ${
                day.isCurrentMonth
                  ? isSelected
                    ? "border-[#0053a0] bg-[#0053a0]/10 shadow-[inset_0_0_0_1px_rgba(0,83,160,0.35)]"
                    : "border-slate-200 bg-white hover:border-[#0053a0]/40 hover:bg-[#0053a0]/5"
                  : "border-slate-200 bg-slate-50 text-slate-300"
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  day.isCurrentMonth
                    ? isSelected
                      ? "text-[#0053a0]"
                      : "text-slate-700"
                    : "text-slate-400"
                }`}
              >
                {dayLabel}
              </span>

              <div className="space-y-1">
                {visibleMarkers.map((ride) => {
                  const rideDisplayTime = getRideCalendarDisplayTime(ride);

                  if (selectedView === "Monat") {
                    return (
                      <span
                        key={ride.id}
                        className={`block truncate rounded-full px-1.5 py-0.5 text-center text-[9px] font-semibold leading-none text-white ${statusMetadata[ride.status].color}`}
                        title={getRideCalendarTitle(ride)}
                      >
                        {rideDisplayTime || "---"}
                      </span>
                    );
                  }

                  return (
                    <span
                      key={ride.id}
                      className="block rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700"
                      title={getRideCalendarTitle(ride)}
                    >
                      {rideDisplayTime ? (
                        <span
                          className={`block truncate rounded-full px-1.5 py-0.5 text-center text-[9px] font-semibold leading-none text-white ${statusMetadata[ride.status].color}`}
                        >
                          {rideDisplayTime}
                        </span>
                      ) : (
                        <span
                          className={`block h-2 rounded-full ${statusMetadata[ride.status].color}`}
                        />
                      )}

                      <span className="mt-1 block min-w-0 truncate">
                        {ride.title}
                      </span>
                    </span>
                  );
                })}

                {ridesForDay.length > visibleMarkers.length ? (
                  <span className="block text-[10px] font-semibold text-slate-400">
                    +{ridesForDay.length - visibleMarkers.length}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
