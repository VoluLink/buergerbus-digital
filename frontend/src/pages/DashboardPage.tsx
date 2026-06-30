import { DayTimelineCalendar } from "../features/dashboard/components/DayTimelineCalendar";
import { MonthWeekCalendar } from "../features/dashboard/components/MonthWeekCalendar";
import { DashboardToolbar } from "../features/dashboard/components/DashboardToolbar";
import { DashboardHeader } from "../features/dashboard/components/DashboardHeader";
import { DayDialog } from "../features/dashboard/components/DayDialog";
import { RideDialog } from "../features/dashboard/components/RideDialog";
import { useDashboardCalendarModel } from "../features/dashboard/hooks/useDashboardCalendarModel";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboardData } from "../features/dashboard/hooks/useDashboardData";
import { useRideDialogState } from "../features/dashboard/hooks/useRideDialogState";
import { useRoleVisibility } from "../hooks/useRoleVisibility";
import { saveDashboardState } from "../services/dashboardState";
import { useCurrentDriverIdentity } from "../features/dashboard/hooks/useCurrentDriverIdentity";
import { useDashboardRideActions } from "../features/dashboard/hooks/useDashboardRideActions";
import {
  normalizeDate,
  addDays,
  addMonths,
  toDateInputValue,
} from "../features/dashboard/utils/dateUtils";
import { StatusLegend } from "../features/dashboard/components/StatusLegend";
import ProtectedSideMenu from "../components/ProtectedSideMenu";

import type { CalendarRide } from "../types/DashboardRide";
type DayRole = "dispo" | "fahrer";
type CalendarView = "Monat" | "Woche" | "Tag";

const calendarViews: CalendarView[] = ["Monat", "Woche", "Tag"];

const topFilters = ["Offene Fahrten", "Meine Fahrten", "Alle Fahrten"];

function DashboardPage() {
  // Routing, Auth und Rollen
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    canManageDataCrud,
    canManageInitiatives,
    isAdmin,
    isDisponent,
    isFahrer,
    isGast,
  } = useRoleVisibility();

  // Rollenabhängige UI-Regeln
  const isRideCrudRestricted = !canManageDataCrud;
  const visibleTopFilters = isGast
    ? []
    : isDisponent
      ? topFilters.filter((filter) => filter !== "Meine Fahrten")
      : topFilters;

  // Kalender-Grunddatum
  const today = useMemo(() => normalizeDate(new Date()), []);

  // Lokaler UI-State für Filter, Kalenderansicht, Dialoge und Menü
  const [selectedFilter, setSelectedFilter] = useState("Alle Fahrten");
  const [selectedView, setSelectedView] = useState<CalendarView>("Monat");
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [dayRole, setDayRole] = useState<DayRole>("dispo");

  // Tagesdialog: Löschen, Aufklappen und Fahreransicht
  const [ridePendingDelete, setRidePendingDelete] =
    useState<CalendarRide | null>(null);
  const [expandedRideIds, setExpandedRideIds] = useState<number[]>([]);
  const [collapsedDriverRideIds, setCollapsedDriverRideIds] = useState<
    number[]
  >([]);

  // Lokale ID nur als Fallback für neue UI-Objekte, echte IDs kommen vom Backend
  const [nextRideId, setNextRideId] = useState(1);

  // Aktive Initiative für Admins / initiativeübergreifende Ansicht
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<
    number | null
  >(currentUser?.initiative?.id ?? null);

  // Lädt Fahrten, Fahrer, Fahrzeuge, Fahrgäste und Initiativen
  const {
    calendarRides,
    setCalendarRides,
    fahrerListe,
    fahrzeugListe,
    initiativeListe,
    knownGuests,
    knownGuestsLoaded,
    isDashboardHydrated,
    reloadFahrten,
  } = useDashboardData({
    selectedInitiativeId,
    canManageInitiatives,
  });

  // Verwaltet den kompletten Zustand vom Fahrt-erstellen/-bearbeiten-Dialog
  const {
    rideInEditId,
    setRideInEditId,
    isRideDialogOpen,
    setIsRideDialogOpen,
    rideType,
    setRideType,
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
    rideSaveError,
    setRideSaveError,
    rideCapacityWarning,
    visibleFahrzeuge,
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
  } = useRideDialogState({
    initialDateValue: toDateInputValue(today),
    selectedInitiativeId,
    canManageInitiatives,
    knownGuests,
    knownGuestsLoaded,
    fahrerListe,
    fahrzeugListe,
  });

  // Dynamischer Platzhaltertext je nach Fahrtart
  const remarksPlaceholder = useMemo(() => {
    if (rideType === "theme") {
      return "Zusätzliche Informationen zur Themenfahrt...";
    }

    if (rideType === "rental") {
      return "Bemerkungen zur Vermietung...";
    }

    return "Zusätzliche Informationen zur Fahrt...";
  }, [rideType]);

  // Aktueller Benutzer als Fahrer/Ersteller, inklusive normalisierter Namen für Filter
  const {
    currentDriverNames,
    currentDriverDisplayName,
    currentDriverIdentity,
    currentCreatorDisplayName,
  } = useCurrentDriverIdentity(currentUser);

  const {
    saveRide,
    confirmDeleteRide,
    toggleDriverSelfAssignment,
    canToggleDriverAssignment,
    canManagePassengerChecks,
    togglePassengerCompleted,
  } = useDashboardRideActions({
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

    canManageAsStaff: isAdmin || isDisponent,
  });

  // Admins bekommen automatisch eine Initiative vorausgewählt, falls noch keine gesetzt ist
  useEffect(() => {
    if (!canManageInitiatives) {
      return;
    }

    if (selectedInitiativeId == null && initiativeListe.length > 0) {
      setSelectedInitiativeId(initiativeListe[0].id);
    }
  }, [canManageInitiatives, initiativeListe, selectedInitiativeId]);

  // Persistiert lokalen Dashboard-Zustand, sobald die Backend-Daten geladen sind
  useEffect(() => {
    if (!isDashboardHydrated) {
      return;
    }

    const completedPassengerKeys = calendarRides.flatMap((ride) =>
      ride.passengers
        .filter((passenger) => passenger.istAbgehakt)
        .map((passenger) => `${ride.id}:${passenger.id}`),
    );

    void saveDashboardState({
      rides: calendarRides,
      completedPassengerKeys,
      nextRideId,
    });
  }, [calendarRides, isDashboardHydrated, nextRideId]);

  // Tagesdialog öffnen/schließen
  function openDayDialog(date: Date) {
    if (isGast) {
      return;
    }

    setSelectedDate(normalizeDate(date));
    setIsDayDialogOpen(true);
  }

  function closeDayDialog() {
    setRidePendingDelete(null);
    setExpandedRideIds([]);
    setCollapsedDriverRideIds([]);
    setIsDayDialogOpen(false);
  }

  // Fahrt-Dialog aus der aktuellen Kalenderauswahl öffnen
  function openRideDialogForSelection() {
    if (isRideCrudRestricted) {
      return;
    }

    const initialVehicleId =
      visibleFahrzeuge.length === 1 ? visibleFahrzeuge[0].id : null;
    setIsDayDialogOpen(false);
    openRideDialog(toDateInputValue(selectedDate), initialVehicleId);
  }

  // Fahrer-Ansicht: Karten auf-/zuklappen
  function toggleRideExpanded(rideId: number) {
    setExpandedRideIds((current) =>
      current.includes(rideId)
        ? current.filter((id) => id !== rideId)
        : [...current, rideId],
    );
  }

  function toggleDriverRideCollapsed(rideId: number) {
    setCollapsedDriverRideIds((current) =>
      current.includes(rideId)
        ? current.filter((id) => id !== rideId)
        : [...current, rideId],
    );
  }

  // Fahrt bearbeiten oder löschen
  function openEditRideDialog(ride: CalendarRide) {
    if (isRideCrudRestricted) {
      return;
    }

    setSelectedDate(normalizeDate(ride.date));
    setIsDayDialogOpen(false);
    loadRideIntoDialog(ride);
  }

  function requestDeleteRide(ride: CalendarRide) {
    if (isRideCrudRestricted) {
      return;
    }

    setRidePendingDelete(ride);
  }

  function cancelDeleteRide() {
    setRidePendingDelete(null);
  }

  // Seitennavigation
  function closeSideMenu() {
    setIsSideMenuOpen(false);
  }

  // Kalendernavigation: Monat, Woche oder Tag verschieben
  function shiftPeriod(amount: number) {
    if (selectedView === "Monat") {
      setCurrentMonth((current) => addMonths(current, amount));
      setSelectedDate((current) => addMonths(current, amount));
      return;
    }

    if (selectedView === "Woche") {
      setSelectedDate((current) => {
        const nextDate = addDays(current, amount * 7);
        setCurrentMonth(
          new Date(nextDate.getFullYear(), nextDate.getMonth(), 1),
        );
        return nextDate;
      });
      return;
    }

    setSelectedDate((current) => {
      const nextDate = addDays(current, amount);
      setCurrentMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
      return nextDate;
    });
  }

  // Bereitet alle Kalenderdaten für Monats-, Wochen- und Tagesansicht auf
  const {
    ridesByDay,
    activeCalendarDays,
    monthHeading,
    dialogHeading,
    selectedDayRides,
    hasDriverDayView,
  } = useDashboardCalendarModel({
    calendarRides,
    selectedFilter,
    currentDriverNames,
    currentMonth,
    selectedDate,
    selectedView,
  });

  // Aktuelles Fahrzeug und Kapazitätsgrenze für den Fahrt-Dialog
  const selectedRideVehicle = useMemo(
    () =>
      activeRideForm == null
        ? null
        : (visibleFahrzeuge.find(
            (vehicle) => vehicle.id === activeRideForm.fahrzeugId,
          ) ?? null),
    [activeRideForm, visibleFahrzeuge],
  );

  const maxPassengersForActiveRide = selectedRideVehicle?.kapazitaet ?? 0;

  const isPassengerLimitReached =
    activeRideForm != null &&
    activeRideForm.passengers.length >= maxPassengersForActiveRide;

  // Filter korrigieren, wenn Rolle keine bestimmte Ansicht nutzen darf
  useEffect(() => {
    if (isGast && selectedFilter !== "Alle Fahrten") {
      setSelectedFilter("Alle Fahrten");
      return;
    }

    if (isDisponent && selectedFilter === "Meine Fahrten") {
      setSelectedFilter("Alle Fahrten");
    }
  }, [isDisponent, isGast, selectedFilter]);

  // Tagesdialog automatisch zwischen Dispo- und Fahreransicht synchronisieren
  useEffect(() => {
    if (!hasDriverDayView && dayRole === "fahrer") {
      setDayRole("dispo");
      return;
    }

    if (isFahrer && hasDriverDayView && dayRole !== "fahrer") {
      setDayRole("fahrer");
    }
  }, [dayRole, hasDriverDayView, isFahrer]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <DashboardHeader
        visibleTopFilters={visibleTopFilters}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        canManageInitiatives={canManageInitiatives}
        selectedInitiativeId={selectedInitiativeId}
        setSelectedInitiativeId={setSelectedInitiativeId}
        initiativeListe={initiativeListe}
        openSideMenu={() => setIsSideMenuOpen(true)}
        openProfile={() => navigate(isGast ? "/dashboard" : "/profil")}
      />

      <div className="p-2 sm:p-4 lg:p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-6 lg:p-8">
          <DashboardToolbar
            monthHeading={monthHeading}
            calendarViews={calendarViews}
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            shiftPeriod={shiftPeriod}
            isRideCrudRestricted={isRideCrudRestricted}
            openRideDialogForSelection={openRideDialogForSelection}
          />
          {selectedView === "Tag" ? (
            <DayTimelineCalendar
              selectedDate={selectedDate}
              selectedDayRides={selectedDayRides}
              openDayDialog={openDayDialog}
            />
          ) : (
            <MonthWeekCalendar
              activeCalendarDays={activeCalendarDays}
              selectedView={selectedView}
              selectedDate={selectedDate}
              ridesByDay={ridesByDay}
              openDayDialog={openDayDialog}
            />
          )}

          <StatusLegend />
        </section>
      </div>

      <ProtectedSideMenu
        isOpen={isSideMenuOpen}
        onClose={closeSideMenu}
      />

      <DayDialog
        isOpen={!isGast && isDayDialogOpen}
        dialogHeading={dialogHeading}
        selectedDayRides={selectedDayRides}
        hasDriverDayView={hasDriverDayView}
        dayRole={dayRole}
        setDayRole={setDayRole}
        isFahrer={isFahrer}
        isRideCrudRestricted={isRideCrudRestricted}
        ridePendingDelete={ridePendingDelete}
        expandedRideIds={expandedRideIds}
        collapsedDriverRideIds={collapsedDriverRideIds}
        currentDriverDisplayName={currentDriverDisplayName}
        closeDayDialog={closeDayDialog}
        openRideDialogForSelection={openRideDialogForSelection}
        openEditRideDialog={openEditRideDialog}
        requestDeleteRide={requestDeleteRide}
        cancelDeleteRide={cancelDeleteRide}
        confirmDeleteRide={confirmDeleteRide}
        toggleRideExpanded={toggleRideExpanded}
        toggleDriverRideCollapsed={toggleDriverRideCollapsed}
        toggleDriverSelfAssignment={toggleDriverSelfAssignment}
        canToggleDriverAssignment={canToggleDriverAssignment}
        canManagePassengerChecks={canManagePassengerChecks}
        togglePassengerCompleted={togglePassengerCompleted}
      />
      <RideDialog
        isOpen={isRideDialogOpen}
        isRideCrudRestricted={isRideCrudRestricted}
        rideInEditId={rideInEditId}
        dialogHeading={dialogHeading}
        rideType={rideType}
        setRideType={setRideType}
        activeRideForm={activeRideForm}
        rideSaveError={rideSaveError}
        rideCapacityWarning={rideCapacityWarning}
        closeRideDialog={closeRideDialog}
        visibleFahrzeuge={visibleFahrzeuge}
        fahrerListe={fahrerListe}
        knownGuests={knownGuests}
        rentalName={rentalName}
        setRentalName={setRentalName}
        rentalDateFrom={rentalDateFrom}
        setRentalDateFrom={setRentalDateFrom}
        rentalDateTo={rentalDateTo}
        setRentalDateTo={setRentalDateTo}
        rentalTimeFrom={rentalTimeFrom}
        setRentalTimeFrom={setRentalTimeFrom}
        rentalTimeTo={rentalTimeTo}
        setRentalTimeTo={setRentalTimeTo}
        rentalVehicleId={rentalVehicleId}
        rentalRemarks={rentalRemarks}
        setRentalRemarks={setRentalRemarks}
        remarksPlaceholder={remarksPlaceholder}
        selectedRideVehicle={selectedRideVehicle}
        maxPassengersForActiveRide={maxPassengersForActiveRide}
        isPassengerLimitReached={isPassengerLimitReached}
        updateRideField={updateRideField}
        updatePassengerField={updatePassengerField}
        autofillPassengerFromKnownGuest={autofillPassengerFromKnownGuest}
        updatePassengerSaveAsGuest={updatePassengerSaveAsGuest}
        autofillFahrer={autofillFahrer}
        autofillFahrzeug={autofillFahrzeug}
        addPassengerField={addPassengerField}
        removePassengerField={removePassengerField}
        saveRide={saveRide}
      />
    </main>
  );
}

export default DashboardPage;
