import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { getFahrten } from "../../../services/fahrtApi";
import { getAllFahrer } from "../../../services/fahrerList";
import { getFahrgaeste } from "../../../services/fahrgastApi";
import { getFahrzeuge } from "../../../services/fahrzeugApi";
import { getInitiativen } from "../../../services/initiativeApi";
import {
  mapBackendRideToCalendarRide,
  type BackendFahrtDto,
} from "../../../services/dashboardState";
import type { FahrerListItem } from "../../../types/FahrerListItem";
import type { Fahrzeug } from "../../../types/Fahrzeug";
import type { Fahrgast } from "../../../types/Fahrgast";
import type { Initiative } from "../../../types/Initiative";
import type { CalendarRide } from "../../../types/DashboardRide";

type UseDashboardDataParams = {
  selectedInitiativeId: number | null;
  canManageInitiatives: boolean;
};

type UseDashboardDataResult = {
  calendarRides: CalendarRide[];
  setCalendarRides: Dispatch<SetStateAction<CalendarRide[]>>;
  fahrerListe: FahrerListItem[];
  fahrzeugListe: Fahrzeug[];
  initiativeListe: Initiative[];
  knownGuests: Fahrgast[];
  knownGuestsLoaded: boolean;
  isDashboardHydrated: boolean;
  reloadFahrten: () => Promise<void>;
};

function mapRidesToCalendarRides(
  rides: BackendFahrtDto[],
  fahrerListe: FahrerListItem[],
) {
  return rides.map((dto) => mapBackendRideToCalendarRide(dto, fahrerListe));
}

export function useDashboardData({
  selectedInitiativeId,
  canManageInitiatives,
}: UseDashboardDataParams): UseDashboardDataResult {
  const [calendarRides, setCalendarRides] = useState<CalendarRide[]>([]);
  const [knownGuests, setKnownGuests] = useState<Fahrgast[]>([]);
  const [knownGuestsLoaded, setKnownGuestsLoaded] = useState(false);
  const [fahrerListe, setFahrerListe] = useState<FahrerListItem[]>([]);
  const [fahrzeugListe, setFahrzeugListe] = useState<Fahrzeug[]>([]);
  const [initiativeListe, setInitiativeListe] = useState<Initiative[]>([]);
  const [isDashboardHydrated, setIsDashboardHydrated] = useState(false);

  const fahrerListeRef = useRef<FahrerListItem[]>([]);
  const fahrerLoadPromiseRef = useRef<Promise<FahrerListItem[]> | null>(null);

  useEffect(() => {
    fahrerListeRef.current = fahrerListe;
  }, [fahrerListe]);

  useEffect(() => {
    let isCancelled = false;

    async function loadFahrer() {
      if (canManageInitiatives && selectedInitiativeId == null) {
        setFahrerListe([]);
        return;
      }
      setFahrerListe([]);
      const loadPromise = getAllFahrer(selectedInitiativeId);
      fahrerLoadPromiseRef.current = loadPromise;

      try {
        const data = await loadPromise;

        if (!isCancelled) {
          fahrerListeRef.current = data;
          setFahrerListe(data);
        }
      } catch {
        if (!isCancelled) {
          fahrerListeRef.current = [];
          setFahrerListe([]);
        }
      } finally {
        if (!isCancelled) {
          fahrerLoadPromiseRef.current = null;
        }
      }
    }

    void loadFahrer();

    return () => {
      isCancelled = true;
    };
  }, [canManageInitiatives, selectedInitiativeId]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateRides() {
      try {
        setIsDashboardHydrated(false);
        setCalendarRides([]);

        if (canManageInitiatives && selectedInitiativeId == null) {
          setIsDashboardHydrated(true);
          return;
        }

        if (fahrerLoadPromiseRef.current) {
          await fahrerLoadPromiseRef.current.catch(() => undefined);
        }

        const data = await getFahrten(selectedInitiativeId);

        if (!isCancelled) {
          setCalendarRides(
            mapRidesToCalendarRides(data, fahrerListeRef.current),
          );
          setIsDashboardHydrated(true);
        }
      } catch {
        if (!isCancelled) {
          setCalendarRides([]);
          setIsDashboardHydrated(true);
        }
      }
    }

    void hydrateRides();

    return () => {
      isCancelled = true;
    };
  }, [canManageInitiatives, selectedInitiativeId]);

  useEffect(() => {
    if (!canManageInitiatives) {
      return;
    }

    let isCancelled = false;

    async function loadInitiatives() {
      try {
        const data = await getInitiativen();

        if (!isCancelled) {
          setInitiativeListe(data);
        }
      } catch {
        if (!isCancelled) {
          setInitiativeListe([]);
        }
      }
    }

    void loadInitiatives();

    return () => {
      isCancelled = true;
    };
  }, [canManageInitiatives]);

  useEffect(() => {
    let isCancelled = false;

    async function loadKnownGuests() {
      try {
        setKnownGuestsLoaded(false);
        setKnownGuests([]);
        if (canManageInitiatives && selectedInitiativeId == null) {
          setKnownGuestsLoaded(true);
          return;
        }

        const guests = await getFahrgaeste(selectedInitiativeId);

        if (!isCancelled) {
          setKnownGuests(guests.filter((guest) => guest.aktiv));
          setKnownGuestsLoaded(true);
        }
      } catch {
        if (!isCancelled) {
          setKnownGuests([]);
          setKnownGuestsLoaded(true);
        }
      }
    }

    void loadKnownGuests();

    return () => {
      isCancelled = true;
    };
  }, [canManageInitiatives, selectedInitiativeId]);

  useEffect(() => {
    let isCancelled = false;

    async function loadFahrzeuge() {
      try {
        const data = await getFahrzeuge();

        if (!isCancelled) {
          setFahrzeugListe(data);
        }
      } catch {
        if (!isCancelled) {
          setFahrzeugListe([]);
        }
      }
    }

    void loadFahrzeuge();

    return () => {
      isCancelled = true;
    };
  }, []);

  const reloadFahrten = useCallback(async () => {
    if (fahrerLoadPromiseRef.current) {
      await fahrerLoadPromiseRef.current.catch(() => undefined);
    }

    const data = await getFahrten(selectedInitiativeId);

    setCalendarRides(mapRidesToCalendarRides(data, fahrerListeRef.current));
  }, [selectedInitiativeId]);

  return {
    calendarRides,
    setCalendarRides,
    fahrerListe,
    fahrzeugListe,
    initiativeListe,
    knownGuests,
    knownGuestsLoaded,
    isDashboardHydrated,
    reloadFahrten,
  };
}
