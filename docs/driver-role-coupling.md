# Kopplung von Fahrerrolle und Fahrerprofil

## Bisherige Ursache

Beim Entfernen der Rolle `Fahrer` wurde der vorhandene Fahrer-Datensatz zwar deaktiviert, die normale Fahrerlisten-Abfrage filterte jedoch nur nach `Fahrer.Aktiv`. Benutzeraktivität und die weiterhin vorhandene Fahrerrolle wurden nicht berücksichtigt. Beim erneuten Hinzufügen der Rolle wurde ein vorhandener inaktiver Datensatz nicht reaktiviert.

## Verbindliche Verfügbarkeitsregel

Ein Fahrer ist für neue Zuweisungen und normale Listen nur verfügbar, wenn alle Bedingungen erfüllt sind:

- `Fahrer.Aktiv` ist `true`.
- Der zugehörige Benutzer ist aktiv.
- Der Benutzer besitzt die Rolle `Fahrer`.
- Benutzer und Fahrt gehören zur selben Initiative.

`GET /api/v1/drivers` sowie Fahrer-Dropdowns verwenden diese Regel. Bereits vorhandene `FahrerId`-Verweise in Fahrten bleiben davon unabhängig und können historische Fahrer weiterhin anzeigen.

## Rollen- und Benutzerstatus

- Beim Hinzufügen der Fahrerrolle wird ein fehlender Fahrer-Datensatz einmalig erstellt; ein vorhandener Datensatz wird reaktiviert, sofern der Benutzer aktiv ist.
- Beim Entzug der Fahrerrolle wird der Fahrer-Datensatz deaktiviert, nicht gelöscht. Bestehende Fahrtzuweisungen bleiben zur fachlichen Prüfung bestehen.
- Jede Rollenänderung erhöht die `AuthVersion` und widerruft Refresh-Sessions. Bei Änderung der eigenen Rolle lädt das Frontend das Profil neu, damit Fahreraktionen sofort verschwinden.
- Bei Deaktivierung eines Benutzers wird sein Fahrer-Datensatz deaktiviert und seine Refresh-Sessions werden widerrufen. Beim Reaktivieren wird er nur dann wieder aktiviert, wenn weiterhin die Fahrerrolle besteht.
- Ein Initiativewechsel nutzt weiterhin dieselbe Fahreridentität; da die Initiative am Benutzer hängt, erscheint der Fahrer ohne Duplikat nur noch in der neuen Initiative.

## Serverseitige Absicherung

Neue Fahrerzuweisungen prüfen die Verfügbarkeitsregel und antworten bei nicht mehr verfügbaren Fahrern mit `409 Conflict`. Die Selbstanmeldung prüft dieselbe Regel und antwortet bei fehlender aktiver Fahrerberechtigung mit `403 Forbidden`.

## Datenprüfung

Das Modell erzwingt bereits eine 1:1-Beziehung zwischen Benutzer und Fahrer. Es wurde keine Migration und keine destruktive Datenbereinigung ausgeführt. Für bestehende Daten sollten vor einer optionalen Bereinigung folgende Fälle als Bericht geprüft werden:

- aktiver Fahrer ohne Fahrerrolle,
- aktiver Fahrer mit inaktivem Benutzer,
- Fahrerrolle ohne Fahrer-Datensatz,
- Fahrer mit einer Initiative, die nicht zur Benutzerinitiative passt (im aktuellen Modell nicht separat speicherbar),
- mehrfache Fahrer-Datensätze pro Benutzer (durch den Unique-Fremdschlüssel modellseitig verhindert).
