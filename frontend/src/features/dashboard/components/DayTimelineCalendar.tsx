import { useMemo } from "react";

import { rideStatusMetadata } from "../../../config/rideStatusConfig";
import type { CalendarRide } from "../../../types/DashboardRide";
import { isSameDay } from "../utils/dateUtils";
import { formatHourLabel } from "../utils/calendarViewUtils";
import { buildDayTimelineRideLayout } from "../utils/rideTimelineLayout";
import { getRideTimelineRange } from "../utils/rideTimelineUtils";
import {
  getDayTimelineRideDisplayTime,
  getDayTimelineRideTitle,
  getRideCalendarTitle,
} from "../utils/rideDisplayUtils";

type DayTimelineCalendarProps = {
  selectedDate: Date;
  selectedDayRides: CalendarRide[];
  openDayDialog: (date: Date) => void;
};

const statusMetadata = rideStatusMetadata;

const weekdayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
});

const dayHeaderDateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DAY_TIMELINE_HOUR_HEIGHT = 48;
const DAY_TIMELINE_VERTICAL_PADDING = 18;
const DAY_TIMELINE_TOTAL_HEIGHT =
  DAY_TIMELINE_HOUR_HEIGHT * 24 + DAY_TIMELINE_VERTICAL_PADDING * 2;
const dayTimelineHourMarkers = Array.from({ length: 25 }, (_, index) => index);

export function DayTimelineCalendar({
  selectedDate,
  selectedDayRides,
  openDayDialog,
}: DayTimelineCalendarProps) {
  const dayHeaderLabel = weekdayFormatter.format(selectedDate);
  const dayHeaderDateLabel = dayHeaderDateFormatter.format(selectedDate);

  const dayTimelineRides = useMemo(() => {
    const scheduledRides = selectedDayRides
      .map((ride) => {
        const timelineRange = getRideTimelineRange(ride, selectedDate);

        if (!timelineRange) {
          return null;
        }

        return {
          ride,
          startMinutes: timelineRange.startMinutes,
          endMinutes: timelineRange.endMinutes,
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          ride: CalendarRide;
          startMinutes: number;
          endMinutes: number;
        } => entry !== null,
      )
      .sort(
        (left, right) =>
          left.startMinutes - right.startMinutes ||
          left.ride.title.localeCompare(right.ride.title, "de-DE"),
      );

    return buildDayTimelineRideLayout(scheduledRides);
  }, [selectedDate, selectedDayRides]);

  const dayTimelineUnscheduledRides = useMemo(() => {
    return selectedDayRides.filter(
      (ride) => getRideTimelineRange(ride, selectedDate) === null,
    );
  }, [selectedDate, selectedDayRides]);

  return (
    <div className="mt-4 sm:mt-5">
      <div className="mb-3 text-center text-xs font-semibold capitalize text-slate-500 sm:mb-4 sm:text-sm">
        {dayHeaderLabel}, {dayHeaderDateLabel}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[4.5rem_1fr]">
            <div
              className="relative bg-white"
              style={{ height: `${DAY_TIMELINE_TOTAL_HEIGHT}px` }}
            >
              {dayTimelineHourMarkers.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 sm:right-3 sm:text-xs"
                  style={{
                    top: `${
                      hour * DAY_TIMELINE_HOUR_HEIGHT +
                      DAY_TIMELINE_VERTICAL_PADDING
                    }px`,
                  }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            <div
              className="relative border-l border-slate-200 bg-slate-50/50"
              style={{ height: `${DAY_TIMELINE_TOTAL_HEIGHT}px` }}
            >
              {dayTimelineHourMarkers.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-dashed border-slate-200"
                  style={{
                    top: `${
                      hour * DAY_TIMELINE_HOUR_HEIGHT +
                      DAY_TIMELINE_VERTICAL_PADDING
                    }px`,
                  }}
                />
              ))}

              {dayTimelineRides.map(
                ({ ride, startMinutes, endMinutes, column, columnCount }) => {
                  const top =
                    (startMinutes / 60) * DAY_TIMELINE_HOUR_HEIGHT +
                    DAY_TIMELINE_VERTICAL_PADDING;
                  const durationMinutes = Math.max(
                    endMinutes - startMinutes,
                    45,
                  );
                  const height = Math.max(
                    (durationMinutes / 60) * DAY_TIMELINE_HOUR_HEIGHT,
                    44,
                  );
                  const columnGapPercent = columnCount > 1 ? 1.5 : 0;
                  const widthPercent =
                    (100 - columnGapPercent * (columnCount - 1)) / columnCount;
                  const leftPercent =
                    column * (widthPercent + columnGapPercent);
                  const displayTime = getDayTimelineRideDisplayTime(
                    ride,
                    startMinutes,
                    endMinutes,
                  );
                  const showFullRentalPeriod =
                    ride.type === "rental" &&
                    !!ride.dateBis &&
                    !isSameDay(ride.date, ride.dateBis);

                  return (
                    <button
                      key={ride.id}
                      type="button"
                      onClick={() => openDayDialog(ride.date)}
                      className={`absolute overflow-hidden rounded-xl border border-black/5 p-2 text-left text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition hover:brightness-95 sm:rounded-2xl sm:p-3 ${statusMetadata[ride.status].color}`}
                      style={{
                        top: `${top}px`,
                        left: `calc(${leftPercent}% + 0.5rem)`,
                        width: `calc(${widthPercent}% - 0.5rem)`,
                        height: `${height}px`,
                      }}
                      title={getDayTimelineRideTitle(
                        ride,
                        startMinutes,
                        endMinutes,
                      )}
                    >
                      <div className="space-y-2">
                        <span
                          className={`block rounded-full border border-white/30 bg-white/15 text-center font-semibold text-white backdrop-blur-[1px] ${
                            showFullRentalPeriod
                              ? "whitespace-normal break-words px-2 py-1 text-[9px] leading-tight"
                              : "truncate px-1.5 py-0.5 text-[9px] leading-none"
                          }`}
                        >
                          {displayTime || "---"}
                        </span>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-white sm:text-sm">
                            {ride.title}
                          </div>

                          {ride.type !== "rental" ? (
                            <div className="mt-1 text-[10px] text-white/80 sm:text-xs">
                              {ride.passengers.length} Fahrgäste
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </div>

      {dayTimelineUnscheduledRides.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-700">
            Ohne Uhrzeit
          </div>

          <div className="mt-3 space-y-2">
            {dayTimelineUnscheduledRides.map((ride) => (
              <button
                key={ride.id}
                type="button"
                onClick={() => openDayDialog(ride.date)}
                className={`w-full rounded-xl border border-black/5 px-3 py-2 text-left text-sm font-semibold text-white shadow-sm transition hover:brightness-95 ${statusMetadata[ride.status].color}`}
                title={getRideCalendarTitle(ride)}
              >
                <span
                  className="block truncate rounded-full border border-white/30 bg-white/15 px-1.5 py-0.5 text-center text-[9px] font-semibold leading-none text-white backdrop-blur-[1px]"
                >
                  Ohne Uhrzeit
                </span>

                <span className="mt-2 block min-w-0 truncate text-white">
                  {ride.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
