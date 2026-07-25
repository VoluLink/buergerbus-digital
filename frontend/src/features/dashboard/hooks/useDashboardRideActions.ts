import { useCallback, type Dispatch, type SetStateAction } from "react";

import {
  createFahrt,
  updateFahrt,
  deleteFahrt,
  updateFahrtteilnehmerAbgehakt,
  meldeFahrerAn,
  meldeFahrerAb,
} from "../../../services/fahrtApi";

import {
  mapBackendRideToCalendarRide,
  mapCalendarRideToBackendWriteDto,
} from "../../../services/dashboardState";

import type {
  CalendarRide,
  RideStatus,
  RideType,
} from "../../../types/DashboardRide";

import type { FahrerListItem } from "../../../types/FahrerListItem";
import type { RideFormState } from "../types/rideFormTypes";

import { normalizeDate, toDateInputValue } from "../utils/dateUtils";

import {
  getEarliestPassengerTime,
  getRideStatusByType,
  normalizePassengerText,
} from "../utils/rideDisplayUtils";

import {
  canManagePassengerChecksForRide,
  canToggleDriverAssignmentForRide,
  isRideAssignedToDriver,
} from "../utils/driverAssignmentUtils";

type UseDashboardRideActionsParams = {
  isRideCrudRestricted: boolean;

  calendarRides: CalendarRide[];
  setCalendarRides: Dispatch<SetStateAction<CalendarRide[]>>;

  rideInEditId: number | null;
  setRideInEditId: Dispatch<SetStateAction<number | null>>;
  setIsRideDialogOpen: Dispatch<SetStateAction<boolean>>;

  rideType: RideType;
  activeRideForm: RideFormState | null;

  selectedDate: Date;
  setSelectedDate: Dispatch<SetStateAction<Date>>;
  setCurrentMonth: Dispatch<SetStateAction<Date>>;

  selectedInitiativeId: number | null;

  nextRideId: number;
  setNextRideId: Dispatch<SetStateAction<number>>;

  rentalName: string;
  rentalDateFrom: string;
  rentalDateTo: string;
  rentalTimeFrom: string;
  rentalTimeTo: string;
  rentalVehicleId: number | null;
  rentalRemarks: string;

  ridePendingDelete: CalendarRide | null;
  setRidePendingDelete: Dispatch<SetStateAction<CalendarRide | null>>;

  setExpandedRideIds: Dispatch<SetStateAction<number[]>>;
  setRideSaveError: Dispatch<SetStateAction<string | null>>;

  currentDriverIdentity: string;
  currentCreatorDisplayName: string;

  fahrerListe: FahrerListItem[];
  reloadFahrten: () => Promise<void>;

  canManageAsStaff: boolean;
  canSelfRegisterAsDriver: boolean;
};

function normalizeErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error ? error.message : "Fehler beim Speichern der Fahrt.";

  return rawMessage.replace(/^"|"$/g, "").replace(/^Error:\s*/i, "");
}

export function useDashboardRideActions({
  isRideCrudRestricted,
  calendarRides,
  setCalendarRides,
  rideInEditId,
  setRideInEditId,
  setIsRideDialogOpen,
  rideType,
  activeRideForm,
  selectedDate,
  setSelectedDate,
  setCurrentMonth,
  selectedInitiativeId,
  nextRideId,
  setNextRideId,
  rentalName,
  rentalDateFrom,
  rentalDateTo,
  rentalTimeFrom,
  rentalTimeTo,
  rentalVehicleId,
  rentalRemarks,
  ridePendingDelete,
  setRidePendingDelete,
  setExpandedRideIds,
  setRideSaveError,
  currentDriverIdentity,
  currentCreatorDisplayName,
  fahrerListe,
  reloadFahrten,
  canManageAsStaff,
  canSelfRegisterAsDriver,
}: UseDashboardRideActionsParams) {
  const toggleDriverSelfAssignment = useCallback(
    async (ride: CalendarRide) => {
      if (!canSelfRegisterAsDriver || !currentDriverIdentity) {
        return;
      }

      if (isRideAssignedToDriver(ride, currentDriverIdentity)) {
        await meldeFahrerAb(ride.id);
      } else {
        await meldeFahrerAn(ride.id);
      }

      await reloadFahrten();
    },
    [canSelfRegisterAsDriver, currentDriverIdentity, reloadFahrten],
  );

  const canToggleDriverAssignment = useCallback(
    (ride: CalendarRide) => {
      return canSelfRegisterAsDriver
        && canToggleDriverAssignmentForRide(ride, currentDriverIdentity);
    },
    [canSelfRegisterAsDriver, currentDriverIdentity],
  );

  const canManagePassengerChecks = useCallback(
    (ride: CalendarRide) => {
      return canManagePassengerChecksForRide(
        ride,
        currentDriverIdentity,
        canManageAsStaff,
      );
    },
    [canManageAsStaff, currentDriverIdentity],
  );

  const togglePassengerCompleted = useCallback(
    async (passengerId: number, checked: boolean) => {
      await updateFahrtteilnehmerAbgehakt(passengerId, checked);
      await reloadFahrten();
    },
    [reloadFahrten],
  );

  const confirmDeleteRide = useCallback(async () => {
    if (isRideCrudRestricted) {
      return;
    }

    if (!ridePendingDelete) {
      return;
    }

    const rideId = ridePendingDelete.id;

    await deleteFahrt(rideId);

    setCalendarRides((current) => current.filter((ride) => ride.id !== rideId));

    if (rideInEditId === rideId) {
      setRideInEditId(null);
    }

    setRidePendingDelete(null);
  }, [
    isRideCrudRestricted,
    ridePendingDelete,
    setCalendarRides,
    rideInEditId,
    setRideInEditId,
    setRidePendingDelete,
  ]);

  const saveRide = useCallback(
    async (statusOverride?: RideStatus) => {
      if (isRideCrudRestricted) {
        return;
      }

      setRideSaveError(null);

      if (rideType === "rental") {
        const rideTime =
          rentalTimeFrom && rentalTimeTo
            ? `${rentalTimeFrom}-${rentalTimeTo}`
            : rentalTimeFrom || rentalTimeTo;

        if (rideInEditId !== null) {
          const editedDate = normalizeDate(
            new Date(rentalDateFrom || toDateInputValue(selectedDate)),
          );

          const existingRide = calendarRides.find(
            (ride) => ride.id === rideInEditId,
          );

          const editedRentalRide: CalendarRide = {
            id: rideInEditId,
            date: editedDate,
            dateBis: normalizeDate(
              new Date(rentalDateTo || rentalDateFrom || editedDate),
            ),
            type: "rental",
            status: statusOverride ?? "rental",
            title: rentalName.trim() || "Vermietung",
            time: rideTime,
            endTime: null,
            driverName: "",
            fahrerId: null,
            fahrzeugId: rentalVehicleId,
            createdByName:
              existingRide?.createdByName ?? currentCreatorDisplayName,
            passengers: [],
            remarks: rentalRemarks.trim(),
          };

          const payload = mapCalendarRideToBackendWriteDto(
            editedRentalRide,
            selectedInitiativeId,
          );

          try {
            await updateFahrt(rideInEditId, payload);
          } catch (error) {
            setRideSaveError(normalizeErrorMessage(error));
            return;
          }

          await reloadFahrten();

          setExpandedRideIds((current) =>
            current.filter((id) => id !== rideInEditId),
          );

          setCurrentMonth(
            new Date(editedDate.getFullYear(), editedDate.getMonth(), 1),
          );

          setSelectedDate(editedDate);
          setRideInEditId(null);
          setIsRideDialogOpen(false);

          return;
        }

        const fromDate = normalizeDate(
          new Date(rentalDateFrom || toDateInputValue(selectedDate)),
        );

        const toDate = normalizeDate(
          new Date(
            rentalDateTo || rentalDateFrom || toDateInputValue(selectedDate),
          ),
        );

        const startsAfterEnds = fromDate.getTime() > toDate.getTime();
        const startDate = startsAfterEnds ? toDate : fromDate;
        const endDate = startsAfterEnds ? fromDate : toDate;

        const rentalRide: CalendarRide = {
          id: nextRideId,
          date: startDate,
          dateBis: endDate,
          type: "rental",
          status: statusOverride ?? "rental",
          title: rentalName.trim() || "Vermietung",
          time: rideTime,
          endTime: null,
          driverName: "",
          fahrerId: null,
          fahrzeugId: rentalVehicleId,
          createdByName: currentCreatorDisplayName,
          passengers: [],
          remarks: rentalRemarks.trim(),
        };

        const payload = mapCalendarRideToBackendWriteDto(
          rentalRide,
          selectedInitiativeId,
        );

        let createdRide;

        try {
          createdRide = await createFahrt(payload);
        } catch (error) {
          setRideSaveError(normalizeErrorMessage(error));
          return;
        }

        const backendRide = mapBackendRideToCalendarRide(
          createdRide,
          fahrerListe,
        );

        setCalendarRides((current) => [...current, backendRide]);
        setNextRideId((current) => current + 1);

        setSelectedDate(startDate);
        setCurrentMonth(
          new Date(startDate.getFullYear(), startDate.getMonth(), 1),
        );

        setRideInEditId(null);
        setIsRideDialogOpen(false);

        return;
      }

      if (!activeRideForm) {
        return;
      }

      if (!activeRideForm.date) {
        setRideSaveError("Bitte ein gültiges Fahrtdatum auswählen.");
        return;
      }

      const driverName = normalizePassengerText(
        activeRideForm.driverName,
      ).trim();
      const selectedFahrerId = activeRideForm.fahrerId;
      const selectedDriver = selectedFahrerId
        ? fahrerListe.find((fahrer) => fahrer.fahrerId === selectedFahrerId)
        : null;
      const effectiveFahrerId = selectedDriver?.fahrerId ?? null;

      if (driverName && !selectedFahrerId) {
        setRideSaveError(
          "Bitte Fahrer aus der Liste auswählen oder das Feld leer lassen.",
        );
        return;
      }

      if (selectedFahrerId && !selectedDriver) {
        setRideSaveError(
          "Bitte Fahrer aus der Liste auswÃ¤hlen oder das Feld leer lassen.",
        );
        return;
      }

      const endTime = normalizePassengerText(activeRideForm.endTime).trim();

      const passengers = activeRideForm.passengers.map((passenger, index) => ({
        ...passenger,
        id: index + 1,
      }));

      if (rideInEditId !== null) {
        const baseStatus =
          statusOverride ?? getRideStatusByType(rideType, effectiveFahrerId);

        const existingRide = calendarRides.find(
          (ride) => ride.id === rideInEditId,
        );

        const rideTime = getEarliestPassengerTime(passengers);

        const tempRide: CalendarRide = {
          id: rideInEditId,
          date: normalizeDate(new Date(activeRideForm.date || toDateInputValue(selectedDate))),
          dateBis: rentalDateTo ? normalizeDate(new Date(rentalDateTo)) : null,
          type: rideType,
          status: baseStatus,
          title:
            rideType === "theme"
              ? normalizePassengerText(activeRideForm.themeTitle).trim() ||
                "Themenfahrt"
              : "Standardfahrt",
          time: rideTime,
          endTime,
          driverName,
          createdByName:
            existingRide?.createdByName ?? currentCreatorDisplayName,
          fahrerId: effectiveFahrerId,
          fahrzeugId: activeRideForm.fahrzeugId,
          passengers:
            activeRideForm.passengers.length > 0
              ? activeRideForm.passengers.map((passenger, index) => ({
                  ...passenger,
                  id: index + 1,
                }))
              : (existingRide?.passengers ?? []),
          remarks: normalizePassengerText(activeRideForm.remarks).trim(),
        };

        const payload = mapCalendarRideToBackendWriteDto(
          tempRide,
          selectedInitiativeId,
        );

        let response;

        try {
          response = await updateFahrt(rideInEditId, payload);
        } catch (error) {
          setRideSaveError(normalizeErrorMessage(error));
          return;
        }

        const backendRide = mapBackendRideToCalendarRide(response, fahrerListe);

        setCalendarRides((currentRides) =>
          currentRides.map((ride) =>
            ride.id === rideInEditId ? backendRide : ride,
          ),
        );

        setRideInEditId(null);
        setIsRideDialogOpen(false);

        return;
      }

      const baseStatus =
        statusOverride ?? getRideStatusByType(rideType, effectiveFahrerId);

      const rideTime = getEarliestPassengerTime(passengers);

      const nextRide: CalendarRide = {
        id: nextRideId,
        date: normalizeDate(new Date(activeRideForm.date || toDateInputValue(selectedDate))),
        dateBis: null,
        type: rideType,
        status: baseStatus,
        title:
          rideType === "theme"
            ? normalizePassengerText(activeRideForm.themeTitle).trim() ||
              "Themenfahrt"
            : "Standardfahrt",
        time: rideTime,
        endTime,
        driverName,
        createdByName: currentCreatorDisplayName,
        fahrerId: effectiveFahrerId,
        fahrzeugId: activeRideForm.fahrzeugId,
        passengers,
        remarks: normalizePassengerText(activeRideForm.remarks).trim(),
      };

      const payload = mapCalendarRideToBackendWriteDto(
        nextRide,
        selectedInitiativeId,
      );

      let createdRide;

      try {
        createdRide = await createFahrt(payload);
      } catch (error) {
        setRideSaveError(normalizeErrorMessage(error));
        return;
      }

      const backendRide = mapBackendRideToCalendarRide(
        createdRide,
        fahrerListe,
      );

      setCalendarRides((current) => [...current, backendRide]);

      setRideInEditId(null);
      setIsRideDialogOpen(false);
    },
    [
      isRideCrudRestricted,
      setRideSaveError,
      rideType,
      rentalTimeFrom,
      rentalTimeTo,
      rideInEditId,
      activeRideForm,
      rentalDateFrom,
      selectedDate,
      calendarRides,
      rentalDateTo,
      rentalName,
      rentalVehicleId,
      currentCreatorDisplayName,
      rentalRemarks,
      selectedInitiativeId,
      reloadFahrten,
      setExpandedRideIds,
      setCurrentMonth,
      setSelectedDate,
      setRideInEditId,
      setIsRideDialogOpen,
      nextRideId,
      fahrerListe,
      setCalendarRides,
      setNextRideId,
    ],
  );

  return {
    saveRide,
    confirmDeleteRide,
    toggleDriverSelfAssignment,
    canToggleDriverAssignment,
    canManagePassengerChecks,
    togglePassengerCompleted,
  };
}
