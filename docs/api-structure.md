# API-Struktur

## Inventur und Zielbild

Die Inventur umfasste 80 registrierte Minimal-API-Mappings in den Dateien unter `backend/Endpoints`. Es gibt keine Controller-Routen. Die produktiven Routen folgen jetzt durchgehend dem Präfix `/api/v1` und verwenden englische Ressourcenbezeichnungen. Der Entwicklungsendpunkt `/api/v1/test` wird ausschließlich in der Development-Umgebung registriert.

| Bereich | Kanonische Route(n) | Backend-Datei | Zugriff |
| --- | --- | --- | --- |
| Authentifizierung | `/api/v1/auth/*` | `AuthEndpoints.cs` | Login, Refresh und Passwort-Reset öffentlich; Passwortwechsel angemeldet |
| Benutzer und Rollen | `/api/v1/users`, `/api/v1/users/me`, `/api/v1/users/{id}`, `/api/v1/roles` | `UserEndpoints.cs`, `RoleEndpoints.cs` | abhängig von Eigentümer-, Disponenten- und Admin-Prüfung |
| Initiativen | `/api/v1/admin/initiatives`, `/api/v1/initiatives/options` | `InitiativeEndpoints.cs` | Verwaltung AdminOnly; Optionsliste Admin/Disponent |
| Fahrten und Teilnehmer | `/api/v1/rides`, `/api/v1/participants/{id}/completion` | `FahrtenEndpoints.cs` | bestehende Fahrten- und Eigentümerprüfungen |
| Fahrer und Fahrgäste | `/api/v1/drivers`, `/api/v1/passengers` | `FahrerEndpoints.cs`, `FahrgastEndpoints.cs` | bestehende Rollen- und Initiativenprüfungen |
| Fahrzeuge | `/api/v1/vehicles`, `/api/v1/vehicles/{vehicleId}/maintenance`, `/api/v1/maintenance/{id}`, `/api/v1/vehicles/{vehicleId}/damages`, `/api/v1/damages/{id}` | `FahrzeugServiceEndpoints.cs` | bestehende Berechtigungsprüfungen |
| Mitteilungen | `/api/v1/notifications/active`, `/api/v1/admin/notifications` | `NotificationEndpoints.cs`, `AdminNotificationEndpoints.cs` | aktiv öffentlich, Verwaltung AdminOnly |
| Rundmails | `/api/v1/admin/broadcast-emails` | `AdminNotificationEndpoints.cs` | AdminOnly |
| Administration | `/api/v1/admin/audit-logs`, `/api/v1/admin/settings`, `/api/v1/admin/pages`, `/api/v1/admin/footer-links`, `/api/v1/admin/cleanup/temporary-participants` | jeweilige `Admin*Endpoints.cs` | AdminOnly |
| Öffentliche Inhalte | `/api/v1/public/pages/{slug}`, `/api/v1/public/footer`, `/api/v1/app-settings` | `Public*Endpoints.cs`, `NotificationEndpoints.cs` | öffentlich |

## Bereinigungen

- Entfernt: die fünf unversionierten `/api/initiatives`-Aliasse. Die Verwaltungsoperationen liegen ausschließlich unter `/api/v1/admin/initiatives`.
- Getrennt: Dashboard-Mitteilungen bleiben unter `/api/v1/admin/notifications`; SMTP-Rundmails liegen unter `/api/v1/admin/broadcast-emails`.
- Versioniert: Passwort vergessen und Passwort zurücksetzen sind jetzt `/api/v1/auth/forgot-password` und `/api/v1/auth/reset-password`.
- Vereinheitlicht: deutsche Ressourcenpfade wurden für die interne Anwendung auf die englischen kanonischen Namen migriert. Alle Frontend-Aufrufe verwenden diese Pfade.
- Konsolidiert: `GET /api/v1/users/{id}` ist der alleinige Profil-Endpunkt; der frühere Zusatz `/profile` entfällt.

Es wurden keine Legacy-Aliasse beibehalten, weil im Repository keine externen Clients, mobilen Apps oder Integrationen dokumentiert sind. Für externe Clients ist dies ein kontrollierter Breaking Change von v1; sie müssen auf die oben genannten Routen migrieren.

## Nicht verändert

Passwortregeln, Authentifizierungs- und Autorisierungslogik, CORS, Security Headers, Forwarded-Header-Verhalten, Datenbankschema und fachliche Handlerlogik bleiben unverändert.

## Prüfschritte

- projektweite Suche nach alten produktiven API-Pfaden
- `dotnet build backend/BuergerbusAPI.sln --no-restore`
- `npm.cmd run build` und `npm.cmd run lint` in `frontend`
- `git diff --check`
