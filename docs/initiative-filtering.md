# Initiative and role contexts

## Global admin management

- `GET /api/v1/users` is global for `Admin`, including name/email search and the initiative column. An optional `initiativeId` can be used by future admin filters, but the roles page intentionally does not send it.
- `GET /api/v1/fahrgaeste` is global for `Admin`. The passenger page shows every initiative by default and provides an initiative filter in addition to its existing search.
- Admins may create, edit, move and deactivate passengers across initiatives through the existing management endpoints.

## Initiative-bound operation

- `GET /api/v1/fahrer?initiativeId={id}` filters `Fahrer` through `Fahrer.Benutzer.InitiativeId` in the database.
- The dashboard requests drivers and known passengers with its active initiative ID. It clears these lists on a switch and closes any open ride dialog.
- Ride writes in `ValidateRideWriteAsync` already verify that the assigned driver and referenced regular passengers belong to the ride initiative. A driver from another initiative is rejected even if an API request is manipulated.

## Authorization

The existing `Admin` role is the documented global management role. A `Disponent` is always constrained server-side to its signed `initiativeId`: user and passenger lists are filtered to that initiative, an explicit different `initiativeId` is rejected with HTTP 403, role changes on foreign users are forbidden, and `Admin` cannot be assigned by a disponent.

## Driver autocomplete

The driver autocomplete now closes immediately after click or Enter selection, updates the selected driver normally, closes on Escape or outside click, and opens again only after the user focuses or edits the search field. The result list uses `onMouseDown` and shares its containment ref with the actual driver search area, so an outside-click handler cannot close the list before `autofillFahrer` writes the persisted `fahrerId` and display name into the ride form.

## Verification

- `dotnet build backend/BuergerbusAPI.sln`
- `npm run build` in `frontend`
- `git diff --check`
