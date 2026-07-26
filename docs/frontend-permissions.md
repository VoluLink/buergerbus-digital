# Frontend-Berechtigungen für Datenabrufe

## Ursache

Der Dashboard-Hook `useDashboardData` lud die Fahrgastliste bei jeder Anmeldung. Dadurch wurde `GET /api/v1/passengers` auch für Fahrer ausgelöst, obwohl der Backend-Endpunkt ausschließlich für die Fahrgastverwaltung durch Admins und Disponenten vorgesehen ist. Die Fahrzeugseite lud außerdem die Initiativen-Optionsliste unabhängig von der Rolle. Geschützte Fahrgast- und Rollenverwaltungsseiten waren per Direkt-URL erreichbar und konnten beim Mounten ebenfalls Datenabrufe auslösen.

## Zentrale Berechtigungen

`useRoleVisibility` stellt nun neben den bestehenden Sichtbarkeitswerten diese zentralen Abfrageberechtigungen bereit:

| Berechtigung | Rollen | Geschützte Daten |
| --- | --- | --- |
| `canManagePassengers` | Admin, Disponent | Fahrgäste |
| `canViewInitiativeOptions` | Admin, Disponent | Initiativen-Optionsliste |
| `canManageUsers` | Admin, Disponent | Benutzerliste |
| `canManageRoles` | Admin, Disponent | Rollenverwaltung |
| `canManageInitiatives` | Admin | vollständige Initiativenverwaltung |
| `canManageNotifications` / `canManageSettings` | Admin | Admin-Bereiche |

Die Werte werden erst nach abgeschlossener Authentifizierungsinitialisierung aus dem geladenen Benutzerprofil bestimmt.

## Verhinderten Abrufe

- Fahrer laden auf dem Dashboard keine Fahrgäste mehr.
- Fahrer laden auf der Fahrzeugseite keine Initiativen-Optionsliste mehr.
- Fahrer können Fahrgast- und Rollenverwaltungsseiten nicht mehr per Direkt-URL mounten; daher erfolgen weder Fahrgast-, Benutzer-, Rollen- noch Initiativenabrufe.
- Admin-/Disponenten-Requests bleiben über bestehende geschützte Routen begrenzt; es gibt keine Retry- oder pauschale 403-Unterdrückung.

## Betroffene Komponenten

- `useDashboardData`: Fahrgastabruf wird vor dem Service-Aufruf gegated.
- `FahrzeuginfosPage`: `Promise.all` wurde auf einen rollenabhängigen Ladevorgang aufgeteilt.
- `FahrgastinfosPage` und `RollenverteilungPage`: zusätzliche Guards für direkte Einbindung.
- `App`: geschützte Routen für Fahrgast- und Rollenverwaltung.
