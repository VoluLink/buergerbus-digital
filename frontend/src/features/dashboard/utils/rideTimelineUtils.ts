import type { CalendarRide } from "../../../types/DashboardRide";
import { normalizeDate, isSameDay } from "./dateUtils";
import { parseTimeToMinutes } from "./timeUtils";
import {
  getRideCalendarDisplayTime,
  getTripTimeRange,
  normalizePassengerText,
} from "./rideDisplayUtils";

export function getRideTimelineRange(
  ride: Pick<
    CalendarRide,
    | "id"
    | "date"
    | "dateBis"
    | "type"
    | "time"
    | "endTime"
    | "passengers"
    | "title"
    | "remarks"
    | "fahrzeugId"
  >,
  activeDay?: Date,
) {
  if (ride.type === "rental") {
    const [startTime, endTime] = normalizePassengerText(ride.time).split("-");
    const startMinutes = parseTimeToMinutes(startTime);

    if (startMinutes === null) {
      return null;
    }

    const parsedEndMinutes = parseTimeToMinutes(endTime);
    const selectedDay = activeDay
      ? normalizeDate(activeDay)
      : normalizeDate(ride.date);
    const rentalEndDate = ride.dateBis ? normalizeDate(ride.dateBis) : null;

    if (rentalEndDate && !isSameDay(ride.date, rentalEndDate)) {
      if (isSameDay(selectedDay, ride.date)) {
        return {
          startMinutes,
          endMinutes: 24 * 60,
        };
      }

      if (isSameDay(selectedDay, rentalEndDate)) {
        return {
          startMinutes: 0,
          endMinutes: parsedEndMinutes !== null ? parsedEndMinutes : 24 * 60,
        };
      }

      return {
        startMinutes: 0,
        endMinutes: 24 * 60,
      };
    }

    const endMinutes =
      parsedEndMinutes !== null && parsedEndMinutes > startMinutes
        ? parsedEndMinutes
        : Math.min(startMinutes + 60, 24 * 60);

    return { startMinutes, endMinutes };
  }

  const startMinutes = parseTimeToMinutes(getRideCalendarDisplayTime(ride));

  if (startMinutes === null) {
    return null;
  }

  const { end } = getTripTimeRange(ride);
  const parsedEndMinutes = parseTimeToMinutes(end);
  const endMinutes = parsedEndMinutes === null
    ? Math.min(startMinutes + 60, 24 * 60)
    : parsedEndMinutes < startMinutes
      ? parsedEndMinutes + 24 * 60
      : parsedEndMinutes;

  return {
    startMinutes,
    endMinutes,
  };
}
