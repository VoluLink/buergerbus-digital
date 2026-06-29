# Bürgerbus Digital

![License](https://img.shields.io/badge/License-GPLv3-blue.svg)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Backend](https://img.shields.io/badge/Backend-ASP.NET%20Core-512BD4)
![Database](https://img.shields.io/badge/Database-MariaDB-003545)
![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED)

---

## Übersicht

**Bürgerbus Digital** ist eine webbasierte Verwaltungsplattform zur Organisation von Fahrten, Fahrgästen, Fahrern und Fahrzeugen für Bürgerbus-Systeme.

Aktuell werden viele Prozesse über verschiedene Systeme wie Kalender oder Excel organisiert. Ziel dieses Projekts ist die Zentralisierung aller Verwaltungsprozesse in einer modernen webbasierten Anwendung.

Die Anwendung ermöglicht:

* Verwaltung von Fahrten
* Verwaltung von Fahrgästen
* Verwaltung von Fahrern
* Fahrzeugverwaltung
* Rollen- und Benutzerverwaltung
* Kalenderübersicht aller Fahrten
* Registrierung von Fahrern auf Fahrten
* Benachrichtigungssystem
* Sichere Authentifizierung und Rechteverwaltung

---

## Inhaltsverzeichnis

* [Übersicht](#übersicht)
* [Systemarchitektur](#systemarchitektur)
* [Technologien](#technologien)
* [Hauptfunktionen](#hauptfunktionen)
* [Qualitätsanforderungen](#qualitätsanforderungen)
* [Installation und Deployment](#installation-und-deployment)
* [Lokale URLs und Ports](#lokale-urls-und-ports)
* [Nginx Proxy Manager einrichten](#nginx-proxy-manager-einrichten)
* [E-Mail- und SMTP-Konfiguration](#e-mail--und-smtp-konfiguration)
* [Passwort-Zurücksetzen](#passwort-zurücksetzen)
* [Häufige Fehler](#häufige-fehler)
* [API](#api)
* [Rollenmodell](#rollenmodell)
* [Lizenz](#lizenz)
* [Team](#team)
* [Entwicklungsstatus](#entwicklungsstatus)
* [Kontakt](#kontakt)

---

## Systemarchitektur

```text
Frontend (React + Vite + TypeScript)
        │
        ▼
REST API (ASP.NET Core)
        │
        ▼
Datenzugriffsschicht (Entity Framework Core)
        │
        ▼
MariaDB Datenbank
```

Die Anwendung basiert auf einer Vier-Schichten-Architektur:

1. Frontend
2. Backend
3. Datenzugriffsschicht
4. Datenbank

Dadurch wird eine hohe Wartbarkeit und klare Trennung der Verantwortlichkeiten erreicht.

---

## Technologien

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS

### Backend

* ASP.NET Core
* REST API
* Entity Framework Core

### Datenbank

* MariaDB

### Infrastruktur

* Docker
* Docker Compose
* Nginx Proxy Manager
* NGINX Reverse Proxy
* WireGuard VPN
* Fail2Ban

---

## Hauptfunktionen

### Benutzerverwaltung

* Account anlegen
* Rollen zuweisen
* Benutzer löschen
* Passwort zurücksetzen
* Passwort ändern

### Fahrgastverwaltung

* Fahrgast anlegen
* Fahrgast bearbeiten
* Fahrgast löschen
* Fahrgast Fahrten zuordnen

### Fahrerverwaltung

* Fahrer anlegen
* Fahrer verwalten
* Fahrer Fahrten zuordnen

### Fahrzeugverwaltung

* Fahrzeuge erstellen
* Fahrzeuge bearbeiten
* Fahrzeuge löschen
* Fahrzeugstatus verwalten

### Fahrtenverwaltung

* Fahrten erstellen
* Fahrten veröffentlichen
* Fahrtenkalender
* Fahrerregistrierung
* Fahrtteilnahme stornieren

### Benachrichtigungssystem

* Automatische Benachrichtigungen
* Ereignisbasierter Versand

---

## Qualitätsanforderungen

### Zuverlässigkeit

* Strukturierte Fehlerbehandlung
* Datenbanktransaktionen
* Konsistente Datenhaltung

### Korrektheit

* Serverseitige Validierung
* Klare Systemtrennung
* Vermeidung inkonsistenter Zustände

### Benutzbarkeit

* Moderne intuitive Benutzeroberfläche
* Browserbasierte Nutzung
* Responsive Design

### Wartbarkeit

* Containerisierung mit Docker
* REST-basierte Kommunikation
* Modulare Architektur

### Datenschutz

* DSGVO-konforme Verarbeitung
* Zugriffsschutz über VPN
* Absicherung durch NGINX Reverse Proxy

---

# Installation und Deployment

## Voraussetzungen

Für den Betrieb mit Docker werden benötigt:

* Git
* Docker
* Docker Compose
* Für den Produktivbetrieb: gültige Domain oder Subdomain
* Zugriff auf die DNS-Verwaltung der Domain
* Für HTTPS: öffentlich erreichbare Ports `80` und `443`

Optional für lokale Entwicklung ohne Docker:

* Node.js
* .NET SDK
* MariaDB oder eine kompatible Datenbank

---

## Repository klonen

```bash
git clone https://gitlab.rz.htw-berlin.de/softwareentwicklungsprojekt/sose2026/team-6-buergerbus-digital-landesstiftung-hessen.git
cd team-6-buergerbus-digital-landesstiftung-hessen
```

---

## Start mit `start.sh`

Unter Linux kann das Projekt über das mitgelieferte Startskript eingerichtet und gestartet werden:

```bash
chmod +x start.sh
./start.sh
```

Das Skript führt durch die Erstellung bzw. Aktualisierung der `.env`-Datei.

Dabei werden unter anderem abgefragt:

* Umgebung: `Development`, `Staging` oder `Production`
* Nutzungsmodus: lokaler Zugriff, Server-IP oder Domain
* Datenbank-Zugangsdaten
* JWT-Konfiguration
* E-Mail-/SMTP-Konfiguration
* Frontend- und Backend-URLs
* Admin-Seed-Daten

Die erzeugte `.env` steuert anschließend, welche Container über Docker Compose gestartet werden.

---

## Docker Compose Profile

Das Projekt nutzt Docker Compose Profiles, um Development- und Production-Container sauber zu trennen.

| Profil    | Zweck                                                          |
| --------- | -------------------------------------------------------------- |
| `dev`     | Lokale Entwicklung mit Vite Dev Server, Mailpit und phpMyAdmin |
| `staging` | Produktionsnaher Testbetrieb                                   |
| `prod`    | Produktivbetrieb mit gebautem Frontend und Nginx Proxy Manager |
| `ci`      | Optionaler GitLab Runner                                       |

Die Auswahl erfolgt über die `.env`:

```env
COMPOSE_PROFILES=dev
```

oder:

```env
COMPOSE_PROFILES=prod
```

---

## Development starten

Für Development wird das Frontend über den Vite Dev Server gestartet.

Beispiel `.env` für Development über Server-IP:

```env
ASPNETCORE_ENVIRONMENT=Development
APP_RUN_MODE=development
COMPOSE_PROFILES=dev

USAGE_MODE=SERVER_IP
FRONTEND_ORIGIN=http://<SERVER-IP>:5173
FRONTEND_URL=http://<SERVER-IP>:5173
VITE_API_BASE_URL=http://<SERVER-IP>:5000
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://<SERVER-IP>:5173

EMAIL_SMTP_HOST=mailpit
EMAIL_SMTP_PORT=1025
EMAIL_SMTP_USERNAME=
EMAIL_SMTP_PASSWORD=
EMAIL_FROM_ADDRESS=noreply@buergerbus.local
EMAIL_FROM_NAME=Bürgerbus
EMAIL_USE_SSL=false
```

Start:

```bash
docker compose up -d --build
```

Erwartete Container im Development:

```text
frontend-dev
backend-dev
db
mailpit
phpmyadmin
```

---

## Production konfigurieren und starten

Im Produktivbetrieb wird das Frontend nicht über den Vite Dev Server gestartet. Stattdessen wird das Frontend gebaut und anschließend durch einen nginx-Container ausgeliefert.

Der Zugriff von außen erfolgt über den Nginx Proxy Manager.

Beispiel `.env` für Production mit Domain oder Subdomain:

```env
ASPNETCORE_ENVIRONMENT=Production
APP_RUN_MODE=production
COMPOSE_PROFILES=prod

USAGE_MODE=DOMAIN
FRONTEND_ORIGIN=https://<DOMAIN>
FRONTEND_URL=https://<DOMAIN>
VITE_API_BASE_URL=https://<DOMAIN>
CORS_ALLOWED_ORIGINS=https://<DOMAIN>
```

Wichtig:

In Production muss `CORS_ALLOWED_ORIGINS` auf die echte Frontend-Domain gesetzt werden. `*` ist nur für Development gedacht und wird in Staging/Production vom Setup-Skript und Backend abgelehnt.

Für den initialen Admin-Seed müssen in Production gültige Werte gesetzt sein. `SEED_ADMIN_PASSWORD` darf nicht leer sein und keine Beispielwerte wie `Admin123!` oder `CHANGE_ME` enthalten; `SEED_INITIATIVE_NAME` darf ebenfalls kein `CHANGE_ME` enthalten. `SEED_ADMIN_EMAIL=admin@example.com` bleibt erlaubt, wenn das Passwort sicher gesetzt bzw. durch `start.sh` generiert wurde.

```env
VITE_API_BASE_URL=https://<DOMAIN>
```

In diesem Projekt hängt das Frontend die API-Pfade selbst an, z. B.:

```text
/api/v1/auth/login
```

Deshalb darf `VITE_API_BASE_URL` nicht zusätzlich `/api` enthalten.

Richtig:

```env
VITE_API_BASE_URL=https://<DOMAIN>
```

Falsch:

```env
VITE_API_BASE_URL=https://<DOMAIN>/api
```

Sonst entstehen fehlerhafte URLs wie:

```text
/api/api/v1/auth/login
```

Production starten:

```bash
COMPOSE_PROFILES=prod docker compose up -d --build
```

Falls `COMPOSE_PROFILES=prod` bereits in der `.env` steht, genügt:

```bash
docker compose up -d --build
```

Erwartete Container im Produktivbetrieb:

```text
buergerbus_frontend_prod
buergerbus_backend_prod
buergerbus_db
nginx_proxy_manager
```

Falls vorher Development-Container liefen, kann das Setup vorher bereinigt werden:

```bash
docker compose down --remove-orphans
COMPOSE_PROFILES=prod docker compose up -d --build
```

---

# Lokale URLs und Ports

Die konkreten URLs hängen vom gewählten Startmodus ab.

Im Development kann lokal über `localhost` gearbeitet werden. Wird die Anwendung auf einem Server im Netzwerk gestartet, muss `<SERVER-IP>` durch die IP-Adresse dieses Servers ersetzt werden.

Im Produktivbetrieb erfolgt der Zugriff normalerweise über eine Domain und den Nginx Proxy Manager.

---

## Development über localhost

| Dienst      | URL                     | Port | Beschreibung                                             |
| ----------- | ----------------------- | ---: | -------------------------------------------------------- |
| Frontend    | `http://localhost:5173` | 5173 | React-Entwicklungsserver                                 |
| Backend/API | `http://localhost:5000` | 5000 | ASP.NET Core REST-API                                    |
| Mailpit     | `http://localhost:8025` | 8025 | Weboberfläche für Test-E-Mails                           |
| MariaDB     | `localhost:3306`        | 3306 | Datenbankserver                                          |
| phpMyAdmin  | `http://localhost:8081` | 8081 | Weboberfläche für MariaDB, falls im Dev-Profil aktiviert |

---

## Development über Server-IP

| Dienst      | URL                       | Port | Beschreibung                                                             |
| ----------- | ------------------------- | ---: | ------------------------------------------------------------------------ |
| Frontend    | `http://<SERVER-IP>:5173` | 5173 | React-Entwicklungsserver                                                 |
| Backend/API | `http://<SERVER-IP>:5000` | 5000 | ASP.NET Core REST-API                                                    |
| Mailpit     | `http://<SERVER-IP>:8025` | 8025 | Weboberfläche für Test-E-Mails                                           |
| MariaDB     | `localhost:3306`          | 3306 | Datenbankserver, standardmäßig nur lokal auf dem Server erreichbar       |
| phpMyAdmin  | `http://localhost:8081`   | 8081 | Aus Sicherheitsgründen standardmäßig nur lokal auf dem Server erreichbar |

Hinweis:

`<SERVER-IP>` muss durch die IP-Adresse des Servers ersetzt werden, auf dem Docker Compose ausgeführt wird.

Beispiel:

```text
http://192.168.x.x:5173
```

---

## Production über Nginx Proxy Manager

| Dienst                    | URL                                   | Port | Beschreibung                                       |
| ------------------------- | ------------------------------------- | ---: | -------------------------------------------------- |
| Frontend                  | `https://<DOMAIN>`                    |  443 | Produktives Frontend über Nginx Proxy Manager      |
| Backend/API               | `https://<DOMAIN>/api`                |  443 | API über benutzerdefinierten Pfad `/api`           |
| Nginx Proxy Manager Admin | `http://localhost:8081`               |   81 | Nur lokal per SSH-Tunnel erreichbar                |
| MariaDB                   | `localhost:3306`                      | 3306 | Datenbankserver, nicht öffentlich erreichbar       |
| Frontend-Container intern | `http://buergerbus_frontend_prod:80`  |   80 | Nur intern im Docker-Netzwerk erreichbar           |
| Backend-Container intern  | `http://buergerbus_backend_prod:8080` | 8080 | Nur intern im Docker-Netzwerk erreichbar           |

Im Produktivbetrieb sollten Frontend und Backend nicht direkt über offene Host-Ports angesprochen werden.
Der Nginx Proxy Manager Admin-Port `81` ist ebenfalls nur lokal auf dem Server gebunden.

Der öffentliche Zugriff erfolgt über:

```text
https://<DOMAIN>      → Frontend
https://<DOMAIN>/api  → Backend/API
```

Der Nginx Proxy Manager leitet intern weiter:

```text
buergerbus_frontend_prod:80
buergerbus_backend_prod:8080
```

---

# Nginx Proxy Manager einrichten

Im Produktivbetrieb übernimmt der Nginx Proxy Manager den öffentlichen Zugriff auf die Anwendung.

Die Administrationsoberfläche ist nur lokal auf dem Server erreichbar. Externe Zugriffe laufen weiterhin über `80/443`.

Zugriff per SSH-Tunnel:

```bash
ssh -L 8081:127.0.0.1:81 <USER>@<SERVER-IP>
```

Danach im lokalen Browser öffnen:

```text
http://localhost:8081
```

Nach dem ersten Login sollten die Zugangsdaten geändert und sicher gespeichert werden.

---

## DNS vorbereiten

Für die Domain oder Subdomain muss ein DNS-Eintrag existieren.

Beispiel:

| Typ | Name       | Ziel                  |
| --- | ---------- | --------------------- |
| `A` | `fahrplan` | Öffentliche Server-IP |

Die Domain muss auf den Server zeigen:

```text
<DOMAIN> → <SERVER-IP>
```

Beispiel:

```text
fahrplan.example.org → 203.0.113.10
```

---

## Proxy Host für das Frontend anlegen

Im Nginx Proxy Manager:

```text
Proxy Hosts → Add Proxy Host
```

Tab `Details`:

| Feld                  | Wert                       |
| --------------------- | -------------------------- |
| Domain Names          | `<DOMAIN>`                 |
| Scheme                | `http`                     |
| Forward Hostname / IP | `buergerbus_frontend_prod` |
| Forward Port          | `80`                       |
| Access List           | `Public`                   |
| Cache Assets          | Aus                        |
| Block Common Exploits | An                         |
| Websockets Support    | An                         |

Wichtig:

Das Feld `Scheme` beschreibt die interne Verbindung vom Nginx Proxy Manager zum Container.

Deshalb bleibt es auf:

```text
http
```

Auch wenn die Webseite extern später über HTTPS erreichbar ist.

Die Verbindung sieht so aus:

```text
Browser
  ↓ HTTPS
Nginx Proxy Manager
  ↓ HTTP
buergerbus_frontend_prod:80
```

Wenn hier versehentlich `https` gewählt wird, entsteht häufig:

```text
502 Bad Gateway
```

Der Grund ist, dass der Frontend-Container intern nur HTTP auf Port `80` bereitstellt.

---

## Benutzerdefinierten Pfad für die API anlegen

Da nur eine Domain oder Subdomain verwendet wird, läuft die API unter demselben Host über `/api`.

Im Proxy Host den Tab öffnen:

```text
Custom Locations / Benutzerdefinierte Pfade
```

Dort hinzufügen:

| Feld                  | Wert                      |
| --------------------- | ------------------------- |
| Location              | `/api`                    |
| Scheme                | `http`                    |
| Forward Hostname / IP | `buergerbus_backend_prod` |
| Forward Port          | `8080`                    |

Damit wird weitergeleitet:

```text
https://<DOMAIN>/api/... → buergerbus_backend_prod:8080/api/...
```

Falls in Docker Compose ein Netzwerk-Alias für `backend-prod` eingerichtet ist, kann alternativ auch `backend-prod` verwendet werden. Wenn es zu Problemen kommt, sollte der Containername verwendet werden:

```text
buergerbus_backend_prod
```

---

## SSL-Zertifikat einrichten

Im Proxy Host den Tab öffnen:

```text
SSL
```

Einstellungen:

| Option          | Einstellung                     |
| --------------- | ------------------------------- |
| SSL Certificate | `Request a new SSL Certificate` |
| Force SSL       | An                              |
| HTTP/2 Support  | An                              |
| HSTS Enabled    | Zunächst aus                    |
| HSTS Subdomains | Aus                             |
| DNS Challenge   | Aus                             |

Für Let's Encrypt muss eine echte gültige E-Mail-Adresse verwendet werden.

Nicht verwenden:

```text
admin@example.com
```

Diese Beispieladresse wird von Let's Encrypt abgelehnt und kann zu folgendem Fehler führen:

```text
Unable to register an account with ACME server.
The ACME server believes admin@example.com is an invalid email address.
```

Stattdessen eine echte gültige Adresse verwenden, z. B.:

```text
admin@eigene-domain.de
```

oder eine persönliche gültige E-Mail-Adresse.

HSTS sollte erst aktiviert werden, wenn die Anwendung vollständig getestet ist. Eine falsche HSTS-Konfiguration kann beim Testen Probleme verursachen, weil Browser HTTPS dann streng erzwingen.

---

# E-Mail- und SMTP-Konfiguration

Für Development kann Mailpit verwendet werden:

```env
EMAIL_SMTP_HOST=mailpit
EMAIL_SMTP_PORT=1025
EMAIL_SMTP_USERNAME=
EMAIL_SMTP_PASSWORD=
EMAIL_FROM_ADDRESS=noreply@buergerbus.local
EMAIL_FROM_NAME=Bürgerbus
EMAIL_USE_SSL=false
```

Für Production muss ein echter SMTP-Server eingetragen werden.

Beispiel:

```env
EMAIL_SMTP_HOST=mail.example.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USERNAME=noreply@example.com
EMAIL_SMTP_PASSWORD=CHANGE_ME
EMAIL_FROM_ADDRESS=noreply@example.com
EMAIL_FROM_NAME=Bürgerbus
EMAIL_USE_SSL=false
```

Wichtig:

`EMAIL_FROM_ADDRESS` muss eine gültige E-Mail-Adresse sein.

Richtig:

```env
EMAIL_FROM_ADDRESS=noreply@example.com
EMAIL_FROM_NAME=Bürgerbus
```

Falsch:

```env
EMAIL_FROM_ADDRESS=Bürgerbus
EMAIL_FROM_NAME=Bürgerbus
```

Bei Port `587` wird in der Regel STARTTLS verwendet. Deshalb ist `EMAIL_USE_SSL=false` meistens korrekt.

Bei Port `465` wird meistens direktes SSL/TLS verwendet. Dann wäre typischerweise nötig:

```env
EMAIL_USE_SSL=true
```

---

# Passwort-Zurücksetzen

Für Passwort-Zurücksetzen-Mails wird `FRONTEND_URL` verwendet.

Beispiel:

```env
FRONTEND_URL=https://<DOMAIN>
```

Der Link in der E-Mail zeigt damit auf das Frontend:

```text
https://<DOMAIN>/reset-password?token=...
```

Wichtig:

`FRONTEND_URL` darf nicht auf die API zeigen.

Richtig:

```env
FRONTEND_URL=https://<DOMAIN>
```

Falsch:

```env
FRONTEND_URL=https://<DOMAIN>/api
```

Wenn die URL geändert wurde, muss das Backend neu gestartet werden:

```bash
COMPOSE_PROFILES=prod docker compose up -d --force-recreate backend-prod
```

Danach muss ein neuer Passwort-Zurücksetzen-Link erzeugt werden.

---


# Häufige Fehler

## Nginx Proxy Manager zeigt die Default Site

Symptom:

```text
Congratulations!
You've successfully started the Nginx Proxy Manager.
```

Ursache:

Der Proxy Host wird nicht gematcht oder die NPM-Konfiguration wurde nicht korrekt geladen.

Prüfen:

```bash
curl -H "Host: <DOMAIN>" http://127.0.0.1 | head -40
```

Logs prüfen:

```bash
docker logs nginx_proxy_manager --tail=100
```

---

## Fehler: host not found in upstream

Beispiel:

```text
nginx: [emerg] host not found in upstream "backend-prod"
```

Ursache:

Der Nginx Proxy Manager kann den Namen `backend-prod` im Docker-Netzwerk nicht auflösen.

Lösung:

Im Nginx Proxy Manager bei der Custom Location `/api` den Container-Namen verwenden:

```text
buergerbus_backend_prod
```

statt:

```text
backend-prod
```

Danach speichern und den Nginx Proxy Manager neu starten:

```bash
docker restart nginx_proxy_manager
```

---

## Fehler: 502 Bad Gateway

Wenn im Nginx Proxy Manager bei `Scheme` versehentlich `https` verwendet wird, kann es zu `502 Bad Gateway` kommen.

Korrekt ist intern:

```text
Scheme: http
```

für:

```text
buergerbus_frontend_prod:80
buergerbus_backend_prod:8080
```

---

## Fehler: ERR_SSL_UNRECOGNIZED_NAME_ALERT

Dieser Fehler bedeutet meist, dass für die Domain noch kein gültiger HTTPS-Serverblock oder kein gültiges Zertifikat aktiv ist.

Prüfen:

```bash
docker logs nginx_proxy_manager --tail=100
```

Danach SSL im Nginx Proxy Manager erneut mit einer echten gültigen E-Mail-Adresse erstellen.

---

## Fehler: /api/api/v1/...

Wenn im Browser Requests wie dieser entstehen:

```text
/api/api/v1/auth/login
```

ist `VITE_API_BASE_URL` falsch gesetzt.

Für dieses Projekt korrekt:

```env
VITE_API_BASE_URL=https://<DOMAIN>
```

Nicht korrekt:

```env
VITE_API_BASE_URL=https://<DOMAIN>/api
```

Danach das Frontend neu bauen:

```bash
COMPOSE_PROFILES=prod docker compose build frontend-prod
COMPOSE_PROFILES=prod docker compose up -d frontend-prod
```

---

# Projekt stoppen und zurücksetzen

## Projekt stoppen

```bash
docker compose down
```

## Container und verwaiste Ressourcen entfernen

```bash
docker compose down --remove-orphans
```

## Container, Netzwerke und Volumes löschen

```bash
docker compose down -v --remove-orphans
```

Achtung:

```bash
docker compose down -v
```

löscht persistente Daten wie:

* MariaDB-Daten
* Nginx Proxy Manager Konfiguration
* Let's-Encrypt-Zertifikate

---

# Lokaler Start ohne Docker

Die folgenden Schritte sind nur erforderlich, wenn Frontend und Backend getrennt ohne Docker gestartet werden sollen.

## Frontend lokal starten

```bash
cd frontend
npm install
npm run dev
```

## Backend lokal starten

```bash
cd backend
dotnet restore
dotnet run
```

---

# API

Die Kommunikation erfolgt über eine REST-API.

Beispiel:

```http
GET /api/v1/fahrten
```

---

# Rollenmodell

| Rolle     | Berechtigungen                                    |
| --------- | ------------------------------------------------- |
| Admin     | Vollzugriff                                       |
| Disponent | Verwaltung von Fahrten, Fahrgästen und Fahrzeugen |
| Fahrer    | Registrierung auf Fahrten                         |
| Benutzer  | Eigene Daten verwalten                            |
| Gast      | Sieht Dashboard                                   |

---

# Lizenz

Dieses Projekt steht unter der **GNU General Public License v3.0 (GPLv3)**.

Weitere Informationen:

https://www.gnu.org/licenses/gpl-3.0.de.html

---

# Verwendete Open-Source-Lizenzen

| Technologie  | Lizenz             |
| ------------ | ------------------ |
| React        | MIT License        |
| Vite         | MIT License        |
| TypeScript   | Apache License 2.0 |
| ASP.NET Core | MIT License        |
| Tailwind CSS | MIT License        |

---

# Team

| Name                         | Aufgabe                                |
| ---------------------------- | -------------------------------------- |
| David Wolf                   | Use Case Diagramm                      |
| Rolf Philip Maximilian Faber | ER Diagramm                            |
| Julian Faber                 | UI-Entwurf                             |
| Gesamte Gruppe               | Technische Spezifikation & Entwicklung |

---

# Screenshots

## Kalenderübersicht

## Fahrzeugverwaltung

## Accountverwaltung

---

# Entwicklungsstatus

🚧 Projekt in Entwicklung

Geplante Erweiterungen:

* Mobile Optimierung
* Erweiterte Statistiken
* Wartungsverwaltung

---

# Kontakt

HTW Berlin
Softwareentwicklungsprojekt SoSe 2026
Team 6 – Bürgerbus Digital
