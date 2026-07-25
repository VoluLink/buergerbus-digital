# Initiative filtering for drivers and regular passengers

## Affected endpoints

- `GET /api/v1/fahrer?initiativeId={id}` filters drivers through `Fahrer.Benutzer.InitiativeId`.
- `GET /api/v1/fahrgaeste?initiativeId={id}` filters regular passengers through `Fahrgast.InitiativeId`.
- `GET /api/v1/users?...&initiativeId={id}` filters the user management list, including users with a driver profile.
- Existing ride writes already validate that a selected driver and every referenced regular passenger belong to the ride's `InitiativeId` in `ValidateRideWriteAsync`.

## Authorization

The existing `Admin` role is the application's explicit global initiative-management role: it can select every initiative exposed by the existing initiative administration. It is therefore the documented super-administrator role in the current data model. A `Disponent` (and every non-admin role) is restricted to the initiative in its signed `initiativeId` claim; a differing query parameter is rejected with HTTP 403.

All list filters are part of the EF Core database query. No global driver or passenger list is loaded and filtered in memory.

## Initiative switch behaviour

The shared initiative context is used by the dashboard, driver list, passenger list and user management. A change clears the displayed list immediately, starts a fresh request with `initiativeId`, and ignores obsolete responses through effect cleanup. Without a selected initiative, admin-facing lists remain empty and passenger CRUD is disabled with a clear hint. This also prevents stale autocomplete data in the ride dialog.

## Verification

- Run `dotnet build backend/BuergerbusAPI.sln`.
- Run `npm run build` in `frontend`.
- Verify with an admin: select initiative A and B in quick succession; only the most recently selected list may be rendered.
- Verify with a disponent: call either list endpoint with another `initiativeId`; the API must return HTTP 403.
