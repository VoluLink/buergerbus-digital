# Bürgerbus Digital

![License](https://img.shields.io/badge/License-GPLv3-blue.svg)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Backend](https://img.shields.io/badge/Backend-ASP.NET%20Core-512BD4)
![Database](https://img.shields.io/badge/Database-MariaDB-003545)
![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED)

---

# Übersicht

**Bürgerbus Digital** ist eine webbasierte Verwaltungsplattform zur Organisation von Fahrten, Fahrgästen, Fahrern und Fahrzeugen für Bürgerbus-Systeme.

Aktuell werden viele Prozesse über verschiedene Systeme wie Kalender oder Excel organisiert. Ziel dieses Projekts ist die Zentralisierung aller Verwaltungsprozesse in einer modernen webbasierten Anwendung.

Die Anwendung ermöglicht:

- Verwaltung von Fahrten
- Verwaltung von Fahrgästen
- Verwaltung von Fahrern
- Fahrzeugverwaltung
- Rollen- und Benutzerverwaltung
- Kalenderübersicht aller Fahrten
- Registrierung von Fahrern auf Fahrten
- Benachrichtigungssystem
- Sichere Authentifizierung und Rechteverwaltung

---

# Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Systemarchitektur](#systemarchitektur)
- [Technologien](#technologien)
- [Hauptfunktionen](#hauptfunktionen)
- [Qualitätsanforderungen](#qualitätsanforderungen)
- [Installation](#installation)
- [API](#api)
- [Rollenmodell](#rollenmodell)
- [Deployment](#deployment)
- [Lizenz](#lizenz)
- [Team](#team)
- [Entwicklungsstatus](#entwicklungsstatus)
- [Beitragen](#beitragen)
- [Kontakt](#kontakt)

---

# Systemarchitektur

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

# Technologien

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS

## Backend

- ASP.NET Core
- REST API
- Entity Framework Core

## Datenbank

- MariaDB

## Infrastruktur

- Docker
- Docker Compose
- NGINX Reverse Proxy
- WireGuard VPN
- Fail2Ban

---

# Hauptfunktionen

## Benutzerverwaltung

- Account anlegen
- Rollen zuweisen
- Benutzer löschen
- Passwort zurücksetzen
- Passwort ändern

## Fahrgastverwaltung

- Fahrgast anlegen
- Fahrgast bearbeiten
- Fahrgast löschen
- Fahrgast Fahrten zuordnen

## Fahrerverwaltung

- Fahrer anlegen
- Fahrer verwalten
- Fahrer Fahrten zuordnen

## Fahrzeugverwaltung

- Fahrzeuge erstellen
- Fahrzeuge bearbeiten
- Fahrzeuge löschen
- Fahrzeugstatus verwalten

## Fahrtenverwaltung

- Fahrten erstellen
- Fahrten veröffentlichen
- Fahrtenkalender
- Fahrerregistrierung
- Fahrtteilnahme stornieren

## Benachrichtigungssystem

- Automatische Benachrichtigungen
- Ereignisbasierter Versand

---

# Qualitätsanforderungen

## Zuverlässigkeit

- Strukturierte Fehlerbehandlung
- Datenbanktransaktionen
- Konsistente Datenhaltung

## Korrektheit

- Serverseitige Validierung
- Klare Systemtrennung
- Vermeidung inkonsistenter Zustände

## Benutzbarkeit

- Moderne intuitive Benutzeroberfläche
- Browserbasierte Nutzung
- Responsive Design

## Wartbarkeit

- Containerisierung mit Docker
- REST-basierte Kommunikation
- Modulare Architektur

## Datenschutz

- DSGVO-konforme Verarbeitung
- Zugriffsschutz über VPN
- Absicherung durch NGINX Reverse Proxy

---

# Installation

## Voraussetzungen

- Docker
- Docker Compose
- Git
- Node.js
- .NET SDK
- MariaDB (optional lokal)

---

# Repository klonen

```bash
git clone https://gitlab.rz.htw-berlin.de/softwareentwicklungsprojekt/sose2026/team-6-buergerbus-digital-landesstiftung-hessen.git
cd team-6-buergerbus-digital-landesstiftung-hessen
```

---

# Datenbankkonfiguration

Im Hauptverzeichnis des Projekts muss eine `.env`-Datei angelegt werden.

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=buergerbus
DB_USER=db_user
DB_PASSWORD=your_password
```

---

# Projekt starten

```bash
docker compose up --build
```

---

# Lokale URLs und Ports

> Hinweis: Solange noch kein SSL-Zertifikat eingerichtet ist, erfolgt der Zugriff über `http://`.
> Nach der Einrichtung eines SSL-Zertifikats wird der Zugriff über `https://` ermöglicht.

| Dienst | URL | Port | Beschreibung |
|------|------|------:|---|
| Frontend (Vite Dev Server) | http://localhost:5173 | 5173 | React-Entwicklungsserver |
| Backend (ASP.NET Core API) | http://localhost:5000 | 5000 | REST-API (HTTP) |
| Backend (HTTPS) | http://localhost:5001 | 5001 | REST-API (HTTPS) |
| MariaDB | localhost:3306 | 3306 | Datenbankserver |
| phpMyAdmin (optional) | http://localhost:8080 | 8080 | Weboberfläche für MariaDB |
| NGINX Reverse Proxy | http://localhost:80 | 80 | Reverse Proxy |
| NGINX Reverse Proxy (HTTPS) | http://localhost:443 | 443 | Reverse Proxy mit TLS |
| NGINX Proxy Manager Admin | http://localhost:81 | 81 | Administrationsoberfläche |

---

# Lokaler Start ohne Docker (optional)

Die folgenden Schritte sind nur erforderlich, wenn Frontend und Backend
für Entwicklungszwecke separat ohne Docker Compose gestartet werden sollen.

# Frontend lokal starten

```bash
cd frontend
npm install
npm run dev
```

---

# Backend lokal starten

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

| Rolle | Berechtigungen |
|---|---|
| Admin | Vollzugriff |
| Disponent | Verwaltung von Fahrten, Fahrgästen und Fahrzeugen |
| Fahrer | Registrierung auf Fahrten |
| Benutzer | Eigene Daten verwalten |

---

# Deployment

Die Anwendung wird containerisiert mit Docker Compose betrieben.

Zusätzliche Sicherheitsmaßnahmen:

- NGINX Reverse Proxy
- WireGuard VPN
- Fail2Ban
- HTTPS

---

# Lizenz

Dieses Projekt steht unter der **GNU General Public License v3.0 (GPLv3)**.

Weitere Informationen:

https://www.gnu.org/licenses/gpl-3.0.de.html

---

# Verwendete Open-Source-Lizenzen

| Technologie | Lizenz |
|---|---|
| React | MIT License |
| Vite | MIT License |
| TypeScript | Apache License 2.0 |
| ASP.NET Core | MIT License |
| Tailwind CSS | MIT License |

---

# Team

| Name | Aufgabe |
|---|---|
| David Wolf | Use Case Diagramm |
| Rolf Philip Maximilian Faber | ER Diagramm |
| Julian Faber | UI-Entwurf |
| Gesamte Gruppe | Technische Spezifikation & Entwicklung |

---

# Screenshots

## Kalenderübersicht


## Fahrzeugverwaltung


## Accountverwaltung


---

# Entwicklungsstatus

🚧 Projekt in Entwicklung

Geplante Erweiterungen:

- E-Mail-Benachrichtigungen
- Mobile Optimierung
- Erweiterte Statistiken
- Wartungsverwaltung

---


# Kontakt

HTW Berlin  
Softwareentwicklungsprojekt SoSe 2026  
Team 6 – Bürgerbus Digital