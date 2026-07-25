import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  getRentalStartTime,
  snapTimeToFiveMinuteStep,
} from "../utils/timeUtils";
import { normalizePassengerText } from "../utils/rideDisplayUtils";
import {
  applyThemeDestinationToPassengers,
  createEmptyPassenger,
  createInitialRideForms,
} from "../utils/rideFormUtils";
import type { RideFormState, RideFormType } from "../types/rideFormTypes";
import type { CalendarRide, RideType } from "../../../types/DashboardRide";
import type { Fahrgast } from "../../../types/Fahrgast";
import type { Fahrzeug } from "../../../types/Fahrzeug";
import type { FahrerListItem } from "../../../types/FahrerListItem";
import { toDateInputValue } from "../utils/dateUtils";

type UseRideDialogStateParams = {
  initialDateValue: string;
  selectedInitiativeId: number | null;
  canManageInitiatives: boolean;
  knownGuests: Fahrgast[];
  knownGuestsLoaded: boolean;
  fahrerListe: FahrerListItem[];
  fahrzeugListe: Fahrzeug[];
};

type UseRideDialogStateResult = {
  isRideDialogOpen: boolean;
  setIsRideDialogOpen: Dispatch<SetStateAction<boolean>>;
  rideInEditId: number | null;
  setRideInEditId: Dispatch<SetStateAction<number | null>>;
  rideType: RideType;
  setRideType: Dispatch<SetStateAction<RideType>>;
  rideFormsByType: Record<RideFormType, RideFormState>;
  setRideFormsByType: Dispatch<
    SetStateAction<Record<RideFormType, RideFormState>>
  >;
  activeRideForm: RideFormState | null;
  rentalRemarks: string;
  setRentalRemarks: Dispatch<SetStateAction<string>>;
  rentalName: string;
  setRentalName: Dispatch<SetStateAction<string>>;
  rentalDateFrom: string;
  setRentalDateFrom: Dispatch<SetStateAction<string>>;
  rentalDateTo: string;
  setRentalDateTo: Dispatch<SetStateAction<string>>;
  rentalTimeFrom: string;
  setRentalTimeFrom: Dispatch<SetStateAction<string>>;
  rentalTimeTo: string;
  setRentalTimeTo: Dispatch<SetStateAction<string>>;
  rentalVehicleId: number | null;
  setRentalVehicleId: Dispatch<SetStateAction<number | null>>;
  rideSaveError: string | null;
  setRideSaveError: Dispatch<SetStateAction<string | null>>;
  rideCapacityWarning: string | null;
  setRideCapacityWarning: Dispatch<SetStateAction<string | null>>;
  visibleFahrzeuge: Fahrzeug[];
  resetRideForms: () => void;
  resetRentalForm: (dateValue: string) => void;
  clearRideMessages: () => void;
  openRideDialog: (dateValue: string, initialVehicleId: number | null) => void;
  closeRideDialog: () => void;
  loadRideIntoDialog: (ride: CalendarRide) => void;
  addPassengerField: () => void;
  removePassengerField: (passengerId: number) => void;
  updateRideField: (
    field: keyof Omit<RideFormState, "passengers">,
    value: string,
  ) => void;
  updatePassengerField: (
    passengerId: number,
    field: keyof Omit<
      PassengerFormView,
      "id" | "sourceGuestId" | "saveAsGuest"
    >,
    value: string | boolean,
  ) => void;
  autofillPassengerFromKnownGuest: (
    passengerId: number,
    selectedGuestId: number,
  ) => void;
  updatePassengerSaveAsGuest: (passengerId: number, value: boolean) => void;
  autofillFahrer: (selectedFahrerId: number) => void;
  autofillFahrzeug: (selectedFahrzeugId: number) => void;
};

type PassengerFormView = RideFormState["passengers"][number];

function isRideFormType(value: RideType): value is RideFormType {
  return value === "standard" || value === "theme";
}

export function useRideDialogState({
  initialDateValue,
  selectedInitiativeId,
  canManageInitiatives,
  knownGuests,
  knownGuestsLoaded,
  fahrerListe,
  fahrzeugListe,
}: UseRideDialogStateParams): UseRideDialogStateResult {
  const [isRideDialogOpen, setIsRideDialogOpen] = useState(false);
  const [rideInEditId, setRideInEditId] = useState<number | null>(null);
  const [rideType, setRideType] = useState<RideType>("standard");
  const [rideFormsByType, setRideFormsByType] = useState<
    Record<RideFormType, RideFormState>
  >(createInitialRideForms());
  const [rentalRemarks, setRentalRemarks] = useState("");
  const [rentalName, setRentalName] = useState("");
  const [rentalDateFrom, setRentalDateFrom] = useState(initialDateValue);
  const [rentalDateTo, setRentalDateTo] = useState(initialDateValue);
  const [rentalTimeFrom, setRentalTimeFrom] = useState("");
  const [rentalTimeTo, setRentalTimeTo] = useState("");
  const [rentalVehicleId, setRentalVehicleId] = useState<number | null>(null);
  const [rideSaveError, setRideSaveError] = useState<string | null>(null);
  const [rideCapacityWarning, setRideCapacityWarning] = useState<string | null>(
    null,
  );

  // A dialog belongs to exactly one initiative. Closing it on a switch prevents
  // an already opened dialog from saving a driver or regular passenger selected
  // for the previous initiative.
  useEffect(() => {
    setIsRideDialogOpen(false);
    setRideInEditId(null);
    setRideFormsByType(createInitialRideForms());
    setRentalVehicleId(null);
    setRideSaveError(null);
    setRideCapacityWarning(null);
  }, [selectedInitiativeId]);

  const visibleFahrzeuge = useMemo(() => {
    if (canManageInitiatives && selectedInitiativeId != null) {
      return fahrzeugListe.filter(
        (vehicle) => vehicle.initiativeId === selectedInitiativeId,
      );
    }

    return fahrzeugListe;
  }, [canManageInitiatives, fahrzeugListe, selectedInitiativeId]);

  const activeRideForm = useMemo(() => {
    if (!isRideFormType(rideType)) {
      return null;
    }

    return rideFormsByType[rideType];
  }, [rideFormsByType, rideType]);

  useEffect(() => {
    if (!knownGuestsLoaded) {
      return;
    }

    const allowedGuestIds = new Set(knownGuests.map((guest) => guest.id));

    setRideFormsByType((currentState) => {
      let hasChanges = false;

      const nextState = Object.entries(currentState).reduce<
        Record<RideFormType, RideFormState>
      >(
        (accumulator, [rideFormKey, rideForm]) => {
          const sanitizedPassengers = rideForm.passengers.map((passenger) => {
            if (
              passenger.sourceGuestId == null ||
              allowedGuestIds.has(passenger.sourceGuestId)
            ) {
              return passenger;
            }

            hasChanges = true;

            return {
              ...passenger,
              sourceGuestId: null,
              saveAsGuest: false,
              name: "",
              phone: "",
              pickupAddress: "",
            };
          });

          accumulator[rideFormKey as RideFormType] = {
            ...rideForm,
            passengers: sanitizedPassengers,
          };

          return accumulator;
        },
        {} as Record<RideFormType, RideFormState>,
      );

      return hasChanges ? nextState : currentState;
    });
  }, [knownGuests, knownGuestsLoaded]);

  const resetRideForms = useCallback(() => {
    setRideFormsByType(createInitialRideForms());
  }, []);

  const resetRentalForm = useCallback((dateValue: string) => {
    setRentalName("");
    setRentalRemarks("");
    setRentalDateFrom(dateValue);
    setRentalDateTo(dateValue);
    setRentalTimeFrom("");
    setRentalTimeTo("");
    setRentalVehicleId(null);
  }, []);

  const clearRideMessages = useCallback(() => {
    setRideSaveError(null);
    setRideCapacityWarning(null);
  }, []);

  const openRideDialog = useCallback(
    (dateValue: string, initialVehicleId: number | null) => {
      clearRideMessages();
      setRideInEditId(null);
      resetRideForms();
      resetRentalForm(dateValue);
      setRideFormsByType((currentState) => ({
        standard: { ...currentState.standard, date: dateValue, fahrzeugId: initialVehicleId },
        theme: { ...currentState.theme, date: dateValue, fahrzeugId: initialVehicleId },
      }));
      setRentalVehicleId(initialVehicleId);
      setIsRideDialogOpen(true);
    },
    [clearRideMessages, resetRentalForm, resetRideForms],
  );

  const closeRideDialog = useCallback(() => {
    clearRideMessages();
    setRideInEditId(null);
    setIsRideDialogOpen(false);
  }, [clearRideMessages]);

  const loadRideIntoDialog = useCallback(
    (ride: CalendarRide) => {
      clearRideMessages();
      setRideInEditId(ride.id);
      setRideType(ride.type);
      setIsRideDialogOpen(true);

      if (ride.type === "rental") {
        const rideDateValue = toDateInputValue(ride.date);

        resetRideForms();
        resetRentalForm(rideDateValue);
        setRentalName(ride.title);
        setRentalRemarks(ride.remarks);
        setRentalDateTo(
          ride.dateBis ? toDateInputValue(ride.dateBis) : rideDateValue,
        );
        setRentalTimeFrom(getRentalStartTime(ride.time));
        setRentalTimeTo(
          normalizePassengerText(ride.endTime).trim() ||
            normalizePassengerText(ride.time).split("-")[1]?.trim() ||
            "",
        );
        setRentalVehicleId(ride.fahrzeugId ?? null);
        return;
      }

      const rideDateValue = toDateInputValue(ride.date);
      const seededForms = createInitialRideForms();
      const passengersForEdit =
        ride.passengers.length > 0
          ? ride.passengers
          : [createEmptyPassenger(1)];
      const rideFormKey: RideFormType =
        ride.type === "theme" ? "theme" : "standard";

      seededForms[rideFormKey] = {
        date: rideDateValue,
        driverName: ride.driverName,
        fahrerId: ride.fahrerId,
        fahrzeugId: ride.fahrzeugId,
        endTime: normalizePassengerText(ride.endTime).trim(),
        themeTitle: rideFormKey === "theme" ? ride.title : "",
        themeDestination:
          rideFormKey === "theme"
            ? (ride.passengers[0]?.destinationAddress ?? "")
            : "",
        remarks: ride.remarks,
        passengers: passengersForEdit,
      };

      resetRentalForm(rideDateValue);
      setRideFormsByType(seededForms);
    },
    [clearRideMessages, resetRentalForm, resetRideForms],
  );

  const addPassengerField = useCallback(() => {
    if (rideType === "rental") {
      return;
    }

    const rideFormKey: RideFormType =
      rideType === "theme" ? "theme" : "standard";

    setRideFormsByType((currentState) => {
      const currentRideForm = currentState[rideFormKey];
      const selectedFahrzeug = visibleFahrzeuge.find(
        (vehicle) => vehicle.id === currentRideForm.fahrzeugId,
      );

      if (
        !selectedFahrzeug ||
        currentRideForm.passengers.length >= selectedFahrzeug.kapazitaet
      ) {
        return currentState;
      }

      const nextAvailablePassengerId =
        currentRideForm.passengers.reduce(
          (maxId, passenger) => Math.max(maxId, passenger.id),
          0,
        ) + 1;

      return {
        ...currentState,
        [rideFormKey]: {
          ...currentRideForm,
          passengers: [
            ...currentRideForm.passengers,
            rideType === "theme"
              ? {
                  ...createEmptyPassenger(nextAvailablePassengerId),
                  destinationAddress: currentState.theme.themeDestination,
                }
              : createEmptyPassenger(nextAvailablePassengerId),
          ],
        },
      };
    });
  }, [rideType, visibleFahrzeuge]);

  const removePassengerField = useCallback(
    (passengerId: number) => {
      if (rideType === "rental") {
        return;
      }

      const rideFormKey: RideFormType =
        rideType === "theme" ? "theme" : "standard";

      setRideFormsByType((currentState) => ({
        ...currentState,
        [rideFormKey]: {
          ...currentState[rideFormKey],
          passengers: currentState[rideFormKey].passengers.filter(
            (passenger) => passenger.id !== passengerId,
          ),
        },
      }));
    },
    [rideType],
  );

  const updateRideField = useCallback(
    (field: keyof Omit<RideFormState, "passengers">, value: string) => {
      if (rideType === "rental") {
        return;
      }

      const rideFormKey: RideFormType =
        rideType === "theme" ? "theme" : "standard";

      setRideFormsByType((currentState) => ({
        ...currentState,
        [rideFormKey]: {
          ...currentState[rideFormKey],
          [field]: value,
          ...(field === "driverName" ? { fahrerId: null } : {}),
          ...(rideFormKey === "theme" && field === "themeDestination"
            ? {
                passengers: applyThemeDestinationToPassengers(
                  currentState.theme.passengers,
                  value,
                ),
              }
            : {}),
        },
      }));
    },
    [rideType],
  );

  const updatePassengerField = useCallback(
    (
      passengerId: number,
      field: keyof Omit<
        PassengerFormView,
        "id" | "sourceGuestId" | "saveAsGuest"
      >,
      value: string | boolean,
    ) => {
      if (rideType === "rental") {
        return;
      }

      const rideFormKey: RideFormType =
        rideType === "theme" ? "theme" : "standard";

      setRideFormsByType((currentState) => ({
        ...currentState,
        [rideFormKey]: {
          ...currentState[rideFormKey],
          passengers: currentState[rideFormKey].passengers.map((passenger) =>
            passenger.id === passengerId
              ? {
                  ...passenger,
                  ...(field === "name" ? { sourceGuestId: null } : {}),
                  [field]:
                    field === "time" && typeof value === "string"
                      ? snapTimeToFiveMinuteStep(value)
                      : value,
                }
              : passenger,
          ),
        },
      }));
    },
    [rideType],
  );

  const autofillPassengerFromKnownGuest = useCallback(
    (passengerId: number, selectedGuestId: number) => {
      if (rideType === "rental") {
        return;
      }

      const selectedGuest = knownGuests.find(
        (guest) => guest.id === selectedGuestId,
      );
      const rideFormKey: RideFormType =
        rideType === "theme" ? "theme" : "standard";

      setRideFormsByType((currentState) => ({
        ...currentState,
        [rideFormKey]: {
          ...currentState[rideFormKey],
          passengers: currentState[rideFormKey].passengers.map((passenger) => {
            if (passenger.id !== passengerId) {
              return passenger;
            }

            if (!selectedGuest) {
              return {
                ...passenger,
                sourceGuestId: null,
                saveAsGuest: false,
              };
            }

            return {
              ...passenger,
              sourceGuestId: selectedGuestId,
              saveAsGuest: false,
              name: `${normalizePassengerText(selectedGuest.vorname)} ${normalizePassengerText(selectedGuest.nachname)}`.trim(),
              phone: normalizePassengerText(selectedGuest.telefonnummer),
              pickupAddress: normalizePassengerText(selectedGuest.adresse),
            };
          }),
        },
      }));
    },
    [knownGuests, rideType],
  );

  const updatePassengerSaveAsGuest = useCallback(
    (passengerId: number, value: boolean) => {
      if (rideType === "rental") {
        return;
      }

      const rideFormKey: RideFormType =
        rideType === "theme" ? "theme" : "standard";

      setRideFormsByType((currentState) => ({
        ...currentState,
        [rideFormKey]: {
          ...currentState[rideFormKey],
          passengers: currentState[rideFormKey].passengers.map((passenger) =>
            passenger.id === passengerId
              ? {
                  ...passenger,
                  saveAsGuest: value,
                }
              : passenger,
          ),
        },
      }));
    },
    [rideType],
  );

  const autofillFahrer = useCallback(
    (selectedFahrerId: number) => {
      const selectedFahrer = fahrerListe.find(
        (fahrer) => fahrer.fahrerId === selectedFahrerId,
      );

      if (!selectedFahrer || rideType === "rental") {
        return;
      }

      setRideSaveError(null);

      const rideFormKey: RideFormType =
        rideType === "theme" ? "theme" : "standard";

      setRideFormsByType((currentState) => ({
        ...currentState,
        [rideFormKey]: {
          ...currentState[rideFormKey],
          fahrerId: selectedFahrer.fahrerId,
          driverName: selectedFahrer.name,
        },
      }));
    },
    [fahrerListe, rideType],
  );

  const autofillFahrzeug = useCallback(
    (selectedFahrzeugId: number) => {
      const selectedFahrzeug = visibleFahrzeuge.find(
        (vehicle) => vehicle.id === selectedFahrzeugId,
      );

      if (!selectedFahrzeug) {
        return;
      }

      if (rideType === "rental") {
        setRentalVehicleId(selectedFahrzeugId);
        return;
      }

      const rideFormKey: RideFormType =
        rideType === "theme" ? "theme" : "standard";

      setRideFormsByType((currentState) => {
        const currentRideForm = currentState[rideFormKey];
        const currentPassengerCount = currentRideForm.passengers.length;
        const removedPassengerCount = Math.max(
          0,
          currentPassengerCount - selectedFahrzeug.kapazitaet,
        );

        setRideCapacityWarning(
          removedPassengerCount > 0
            ? `Das neue Fahrzeug hat nur ${selectedFahrzeug.kapazitaet} Plätze. ${removedPassengerCount} Fahrgast${removedPassengerCount === 1 ? "" : "e"} wurde${removedPassengerCount === 1 ? "" : "n"} aus der Fahrt entfernt.`
            : null,
        );

        return {
          ...currentState,
          [rideFormKey]: {
            ...currentRideForm,
            fahrzeugId: selectedFahrzeug.id,
            passengers: currentRideForm.passengers.slice(
              0,
              selectedFahrzeug.kapazitaet,
            ),
          },
        };
      });
    },
    [rideType, visibleFahrzeuge],
  );

  return {
    isRideDialogOpen,
    setIsRideDialogOpen,
    rideInEditId,
    setRideInEditId,
    rideType,
    setRideType,
    rideFormsByType,
    setRideFormsByType,
    activeRideForm,
    rentalRemarks,
    setRentalRemarks,
    rentalName,
    setRentalName,
    rentalDateFrom,
    setRentalDateFrom,
    rentalDateTo,
    setRentalDateTo,
    rentalTimeFrom,
    setRentalTimeFrom,
    rentalTimeTo,
    setRentalTimeTo,
    rentalVehicleId,
    setRentalVehicleId,
    rideSaveError,
    setRideSaveError,
    rideCapacityWarning,
    setRideCapacityWarning,
    visibleFahrzeuge,
    resetRideForms,
    resetRentalForm,
    clearRideMessages,
    openRideDialog,
    closeRideDialog,
    loadRideIntoDialog,
    addPassengerField,
    removePassengerField,
    updateRideField,
    updatePassengerField,
    autofillPassengerFromKnownGuest,
    updatePassengerSaveAsGuest,
    autofillFahrer,
    autofillFahrzeug,
  };
}
