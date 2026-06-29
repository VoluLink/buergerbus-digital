# Testprotokoll – Bürgerbus Digital

## 1. Testlauf

| Feld      | Wert                                              |
| --------- | ------------------------------------------------- |
| Datum     | 2026-06-29                                        |
| Tester    | Philip Faber                                      |
| Branch    | develop                                           |
| Umgebung  | Lokal / Docker Development                        |
| Datenbank | MariaDB über Docker                               |
| Ergebnis  | Bestanden / Teilweise bestanden / Nicht bestanden |

---

## 2. Technische Checks

| Prüfung                   | Befehl                                        | Ergebnis | Bemerkung |
| ------------------------- | --------------------------------------------- | -------- | --------- |
| Frontend Lint             | `npm run lint`                                | ⬜       |           |
| Frontend Build            | `npm run build`                               | ⬜       |           |
| Backend Build             | `dotnet build`                                | ⬜       |           |
| Docker Compose Config     | `docker compose config`                       | ⬜       |           |
| Production Compose Config | `COMPOSE_PROFILES=prod docker compose config` | ⬜       |           |
| Production Docker Build   | `COMPOSE_PROFILES=prod docker compose build`  | ⬜       |           |

Legende:

- ✅ bestanden
- ⚠️ teilweise bestanden
- ❌ fehlgeschlagen
- ⬜ nicht getestet

---

## 3. Datenbank und Migrationen

| Prüfung                                 | Ergebnis | Bemerkung |
| --------------------------------------- | -------- | --------- |
| Datenbank startet fehlerfrei            | ⬜       |           |
| Tabelle `__EFMigrationsHistory` geprüft | ⬜       |           |
| Performance-Indizes vorhanden           | ⬜       |           |
| SeedData legt Rollen an                 | ⬜       |           |
| SeedData legt Default-Initiative an     | ⬜       |           |
| SeedData legt Admin-Benutzer an         | ⬜       |           |

Geprüfte SQL-Befehle:

```sql
SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId;

SELECT COUNT(*) AS Rollen FROM Rollen;
SELECT COUNT(*) AS Initiativen FROM Initiativen;
SELECT COUNT(*) AS Benutzer FROM Benutzer;
SELECT COUNT(*) AS BenutzerRollen FROM BenutzerRollen;

SHOW INDEX FROM Fahrten;
SHOW INDEX FROM Notifications;
SHOW INDEX FROM NotificationRecipients;
```

---

## 4. Authentifizierung und Passwort

| Testfall                    | Erwartetes Ergebnis      | Ergebnis | Bemerkung |
| --------------------------- | ------------------------ | -------- | --------- |
| Login mit gültigem Admin    | Benutzer wird eingeloggt | ⬜       |           |
| Login mit falschem Passwort | Fehlermeldung erscheint  | ⬜       |           |
| Logout                      | Benutzer wird ausgeloggt | ⬜       |           |
| Geschützte Seite ohne Login | Weiterleitung zum Login  | ⬜       |           |
| Passwort vergessen          | Reset-Mail wird erzeugt  | ⬜       |           |
| Passwort-Reset-Link         | Reset-Seite öffnet sich  | ⬜       |           |
| Neues Passwort setzen       | Passwort wird geändert   | ⬜       |           |
| Login mit neuem Passwort    | Login funktioniert       | ⬜       |           |

---

## 5. Dashboard und Fahrten

| Testfall                 | Erwartetes Ergebnis                        | Ergebnis | Bemerkung |
| ------------------------ | ------------------------------------------ | -------- | --------- |
| Dashboard lädt           | Kalender/Fahrten werden angezeigt          | ⬜       |           |
| Monat/Woche/Tag wechseln | Ansicht ändert sich korrekt                | ⬜       |           |
| Neue Fahrt erstellen     | Fahrt wird gespeichert                     | ⬜       |           |
| Standardfahrt erstellen  | Pflichtfelder und Teilnehmer funktionieren | ⬜       |           |
| Themenfahrt erstellen    | Fahrt wird korrekt gespeichert             | ⬜       |           |
| Vermietung erstellen     | Fahrt wird korrekt gespeichert             | ⬜       |           |
| Fahrt bearbeiten         | Änderungen werden gespeichert              | ⬜       |           |
| Fahrt löschen/stornieren | Fahrt wird entfernt oder Status geändert   | ⬜       |           |
| Fahrzeugauswahl          | Nur passende Fahrzeuge auswählbar          | ⬜       |           |
| Teilnehmer abhaken       | Status wird gespeichert                    | ⬜       |           |
| Temporäre Teilnehmer     | Werden korrekt gespeichert                 | ⬜       |           |

---

## 6. Fahrgastinformationen

| Testfall                      | Erwartetes Ergebnis                        | Ergebnis | Bemerkung |
| ----------------------------- | ------------------------------------------ | -------- | --------- |
| Fahrgastliste lädt            | Fahrgäste werden angezeigt                 | ⬜       |           |
| Fahrgast anlegen              | Neuer Fahrgast wird gespeichert            | ⬜       |           |
| Fahrgast bearbeiten           | Änderungen werden gespeichert              | ⬜       |           |
| Fahrgast löschen/deaktivieren | Fahrgast wird korrekt entfernt/deaktiviert | ⬜       |           |
| Suche/Filter                  | Ergebnisse werden korrekt gefiltert        | ⬜       |           |
| Admin-Sicht                   | Admin sieht initiativenübergreifend        | ⬜       |           |
| Disponenten-Sicht             | Disponent sieht nur eigene Initiative      | ⬜       |           |

---

## 7. Fahrzeuginformationen

| Testfall            | Erwartetes Ergebnis                               | Ergebnis | Bemerkung |
| ------------------- | ------------------------------------------------- | -------- | --------- |
| Fahrzeugliste lädt  | Fahrzeuge werden angezeigt                        | ⬜       |           |
| Fahrzeug anlegen    | Neues Fahrzeug wird gespeichert                   | ⬜       |           |
| Fahrzeug bearbeiten | Änderungen werden gespeichert                     | ⬜       |           |
| Wartung anlegen     | Wartung wird gespeichert                          | ⬜       |           |
| Schaden anlegen     | Schaden wird gespeichert                          | ⬜       |           |
| Status ändern       | Status wird korrekt übernommen                    | ⬜       |           |
| Initiativenfilter   | Fahrzeuge werden passend zur Initiative angezeigt | ⬜       |           |

---

## 8. Benutzer, Rollen und Rechte

| Testfall                | Erwartetes Ergebnis                    | Ergebnis | Bemerkung |
| ----------------------- | -------------------------------------- | -------- | --------- |
| Benutzerliste lädt      | Benutzer werden angezeigt              | ⬜       |           |
| Benutzer anlegen        | Benutzer wird erstellt                 | ⬜       |           |
| Rolle zuweisen          | Rolle wird gespeichert                 | ⬜       |           |
| Rolle entfernen         | Rolle wird entfernt                    | ⬜       |           |
| Admin-Rechte            | Admin hat Zugriff auf Adminbereiche    | ⬜       |           |
| Disponent-Rechte        | Disponent sieht nur zulässige Bereiche | ⬜       |           |
| Fahrer-Rechte           | Fahrer hat keine Verwaltungsrechte     | ⬜       |           |
| Fremdes Profil anzeigen | Admin kann Profile öffnen              | ⬜       |           |
| Fremdes Profil löschen  | Admin kann fremdes Profil löschen      | ⬜       |           |
| Eigenes Profil löschen  | Wird verhindert oder nicht angeboten   | ⬜       |           |

---

## 9. Initiativen

| Testfall                   | Erwartetes Ergebnis                | Ergebnis | Bemerkung |
| -------------------------- | ---------------------------------- | -------- | --------- |
| Initiativenliste lädt      | Initiativen werden angezeigt       | ⬜       |           |
| Initiative anlegen         | Neue Initiative wird gespeichert   | ⬜       |           |
| Initiative bearbeiten      | Änderungen werden gespeichert      | ⬜       |           |
| Initiative löschen         | Löschregeln werden eingehalten     | ⬜       |           |
| Default-Initiative löschen | Löschen wird verhindert            | ⬜       |           |
| Benutzerzuordnung          | Benutzer werden korrekt zugeordnet | ⬜       |           |

---

## 10. Admin- und Systemfunktionen

| Testfall                        | Erwartetes Ergebnis                | Ergebnis | Bemerkung |
| ------------------------------- | ---------------------------------- | -------- | --------- |
| Admin-Benachrichtigungen öffnen | Seite lädt korrekt                 | ⬜       |           |
| Benachrichtigung senden         | Empfänger werden korrekt ermittelt | ⬜       |           |
| Mailversand Dev                 | Mail erscheint in Mailpit          | ⬜       |           |
| Footer-/Seitenverwaltung        | Inhalte werden gespeichert         | ⬜       |           |
| Öffentliche Seiten              | Seiten sind ohne Login erreichbar  | ⬜       |           |

---

## 11. Production- und Deployment-Checks

| Prüfung                             | Erwartetes Ergebnis                 | Ergebnis | Bemerkung |
| ----------------------------------- | ----------------------------------- | -------- | --------- |
| `.env` enthält keine Platzhalter    | Keine `CHANGE_ME`-Werte             | ⬜       |           |
| `ASPNETCORE_ENVIRONMENT` korrekt    | `Production` in Production          | ⬜       |           |
| `CORS_ALLOWED_ORIGINS` korrekt      | Keine Wildcard `*` in Production    | ⬜       |           |
| `JWT_SECRET` stark gesetzt          | Kein Testwert                       | ⬜       |           |
| `SEED_ADMIN_PASSWORD` stark gesetzt | Kein Standardpasswort               | ⬜       |           |
| Nginx Proxy Manager erreichbar      | Nur per SSH-Tunnel/Admin-Port lokal | ⬜       |           |
| Webseite über HTTPS erreichbar      | Domain lädt korrekt                 | ⬜       |           |
| API über `/api` erreichbar          | Backend antwortet korrekt           | ⬜       |           |
| Passwort-Reset-Link Production      | Link zeigt auf richtige Domain      | ⬜       |           |
| Backup-Konzept dokumentiert         | VM-Backup oder DB-Dump vorhanden    | ⬜       |           |

---

## 12. Bekannte offene Punkte

| Punkt | Auswirkung | Priorität               | Bemerkung |
| ----- | ---------- | ----------------------- | --------- |
|       |            | Niedrig / Mittel / Hoch |           |

---

## 13. Zusammenfassung

Der Testlauf wurde durchgeführt.

Gesamtergebnis:

```txt
⬜ Bestanden
⬜ Teilweise bestanden
⬜ Nicht bestanden
```

Bemerkung:

```txt
Hier kurz eintragen, ob das System für Abgabe/Deployment freigegeben wird.
```

Freigabe:

| Rolle  | Name         | Datum      |
| ------ | ------------ | ---------- |
| Tester | Philip Faber | 2026-06-29 |
