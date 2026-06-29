import { useMemo } from "react";

import type { CalendarRide } from "../../../types/DashboardRide";
import { addDays, normalizeDate, toDateKey } from "../utils/dateUtils";
import {
  buildMonthDays,
  buildWeekDays,
  formatDialogHeading,
  formatMonthHeading,
} from "../utils/calendarViewUtils";
import { normalizeName } from "../utils/nameUtils";

type CalendarView = "Monat" | "Woche" | "Tag";

type UseDashboardCalendarModelParams = {
  calendarRides: CalendarRide[];
  selectedFilter: string;
  currentDriverNames: string[];
  currentMonth: Date;
  selectedDate: Date;
  selectedView: CalendarView;
};

export function useDashboardCalendarModel({
  calendarRides,
  selectedFilter,
  currentDriverNames,
  currentMonth,
  selectedDate,
  selectedView,
}: UseDashboardCalendarModelParams) {
  const filteredCalendarRides = useMemo(() => {
    if (selectedFilter === "Offene Fahrten") {
      return calendarRides.filter((ride) => ride.status === "open");
    }

    if (selectedFilter === "Meine Fahrten") {
      if (currentDriverNames.length === 0) {
        return [];
      }

      return calendarRides.filter((ride) =>
        currentDriverNames.includes(normalizeName(ride.driverName)),
      );
    }

    return calendarRides;
  }, [calendarRides, currentDriverNames, selectedFilter]);

  const ridesByDay = useMemo(() => {
    return filteredCalendarRides.reduce<Map<string, CalendarRide[]>>(
      (acc, ride) => {
        const addToDay = (date: Date) => {
          const key = toDateKey(date);
          const list = acc.get(key) ?? [];
          acc.set(key, [...list, ride]);
        };

        if (ride.type === "rental" && ride.dateBis) {
          let current = normalizeDate(new Date(ride.date));
          const end = normalizeDate(new Date(ride.dateBis));

          while (current.getTime() <= end.getTime()) {
            addToDay(current);
            current = addDays(current, 1);
          }

          return acc;
        }

        addToDay(ride.date);

        return acc;
      },
      new Map(),
    );
  }, [filteredCalendarRides]);

  const monthDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);

  const weekDaysData = useMemo(
    () => buildWeekDays(selectedDate),
    [selectedDate],
  );

  const activeCalendarDays =
    selectedView === "Monat"
      ? monthDays
      : selectedView === "Woche"
        ? weekDaysData
        : [{ date: selectedDate, isCurrentMonth: true }];

  const monthHeading = formatMonthHeading(currentMonth);
  const dialogHeading = formatDialogHeading(selectedDate);
  const selectedDayRides = ridesByDay.get(toDateKey(selectedDate)) ?? [];
  const hasDriverDayView = selectedDayRides.some(
    (ride) => ride.type !== "rental",
  );

  return {
    filteredCalendarRides,
    ridesByDay,
    activeCalendarDays,
    monthHeading,
    dialogHeading,
    selectedDayRides,
    hasDriverDayView,
  };
}
