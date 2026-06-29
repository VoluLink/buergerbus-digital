import type { CalendarRide } from "../../../types/DashboardRide";
import { normalizeName } from "./nameUtils";

export function isRideAssignedToDriver(
  ride: CalendarRide,
  driverIdentity: string,
) {
  return (
    Boolean(driverIdentity.trim()) &&
    (ride.status === "assigned" || ride.status === "theme") &&
    normalizeName(ride.driverName) === normalizeName(driverIdentity)
  );
}

export function canDriverSelfRegisterForRide(ride: CalendarRide) {
  return (
    !ride.fahrerId &&
    ride.status !== "completed" &&
    ride.status !== "saved" &&
    (ride.type === "theme" || ride.status === "open")
  );
}

export function canToggleDriverAssignmentForRide(
  ride: CalendarRide,
  driverIdentity: string,
) {
  return (
    canDriverSelfRegisterForRide(ride) ||
    isRideAssignedToDriver(ride, driverIdentity)
  );
}

export function canManagePassengerChecksForRide(
  ride: CalendarRide,
  driverIdentity: string,
  canManageAsStaff: boolean,
) {
  return canManageAsStaff || isRideAssignedToDriver(ride, driverIdentity);
}
