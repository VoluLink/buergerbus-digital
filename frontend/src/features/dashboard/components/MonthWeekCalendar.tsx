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
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 sm:mt-5 sm:gap-2 sm:text-sm">
        {weekDays.map((day) => (
          <div key={day} className="py-1.5 sm:py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
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
              className={`flex min-w-0 flex-col justify-between rounded-lg border px-1.5 py-1.5 text-left transition sm:rounded-xl sm:px-3 sm:py-2 ${
                selectedView === "Monat"
                  ? "h-16 sm:h-22 lg:h-24"
                  : "min-h-24 sm:min-h-32"
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
                      className="block rounded-lg bg-slate-100 px-1 py-1 text-[10px] font-semibold text-slate-700 sm:px-2"
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
                  <span className="block text-[9px] font-semibold text-slate-400 sm:text-[10px]">
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
