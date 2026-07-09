import { useMemo } from "react";

import { buildDriverDisplayName } from "../utils/rideDisplayUtils";
import { normalizeName } from "../utils/nameUtils";

type CurrentDashboardUser =
  | {
      username: string;
      email: string;
      vorname?: string | null;
      nachname?: string | null;
    }
  | null
  | undefined;

export function useCurrentDriverIdentity(currentUser: CurrentDashboardUser) {
  const currentDriverDisplayName = useMemo(() => {
    if (!currentUser) {
      return "";
    }

    return buildDriverDisplayName(
      currentUser.username,
      currentUser.email,
      currentUser.vorname ?? undefined,
      currentUser.nachname ?? undefined,
    );
  }, [currentUser]);

  const currentDriverIdentity =
    currentDriverDisplayName ||
    currentUser?.username ||
    currentUser?.email ||
    "";

  const currentDriverNames = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const fullName = buildDriverDisplayName(
      currentUser.username,
      currentUser.email,
      currentUser.vorname ?? undefined,
      currentUser.nachname ?? undefined,
    );

    const candidates = [fullName, currentUser.username, currentUser.email]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => normalizeName(value));

    return Array.from(new Set(candidates));
  }, [currentUser]);

  return {
    currentDriverNames,
    currentDriverDisplayName,
    currentDriverIdentity,
    currentCreatorDisplayName: currentDriverDisplayName,
  };
}
