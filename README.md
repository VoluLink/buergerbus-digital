# Bürgerbus Frontend

Frontend des Projekts **Bürgerbus Digital** auf Basis von **React**, **Vite**, **TypeScript** und **Tailwind CSS**.

## Verwendeter Stack

Dieses Frontend nutzt folgende Technologien und Pakete:

### Basis
- **React**  
  Bibliothek zum Erstellen der Benutzeroberfläche

- **Vite**  
  Entwicklungsserver und Build-Tool für das Frontend

- **TypeScript**  
  Erweiterung von JavaScript mit Typisierung

- **Tailwind CSS**  
  Utility-First-CSS-Framework für schnelles Styling

### Zusätzliche Pakete
- **react-router-dom**  
  Routing und Navigation zwischen Seiten innerhalb der React-Anwendung

- **react-hook-form**  
  Vereinfachte Verwaltung von Formularen in React

- **zod**  
  Validierung und Prüfung von Datenstrukturen

- **@hookform/resolvers**  
  Verbindet `react-hook-form` mit `zod` (z. B. via `zodResolver`)

- **lucide-react**  
  Icon-Bibliothek für React

---

## Wie die Teile zusammenhängen

Die Anwendung besteht aus mehreren Schichten und Hilfspaketen:

### React
React bildet die Grundlage der Oberfläche.  
Damit werden Komponenten, Seiten und Layouts erstellt.

### Vite
Vite startet die Anwendung im Entwicklungsmodus und baut sie später für die Produktion.

### TypeScript
TypeScript sorgt dafür, dass Daten und Komponenten mit klaren Typen definiert werden. Dadurch können Fehler früh erkannt werden.

### Tailwind CSS
Tailwind wird für das Styling der Oberfläche verwendet. Layout, Farben, Abstände und Größen werden direkt über Klassen in den Komponenten definiert.

### React Router
Mit `react-router-dom` wird die Navigation zwischen verschiedenen Seiten umgesetzt, z. B.:

- `/`
- `/fahrten`
- `/fahrer`

### React Hook Form
`react-hook-form` verwaltet Formulare und deren Eingabefelder.

### Zod
`zod` definiert Regeln für die Prüfung der Formulardaten, z. B.:

- Pflichtfelder
- Mindestlänge
- erlaubte Formate

In diesem Projekt ist `@hookform/resolvers` installiert und wird genutzt, um Zod direkt an `react-hook-form` zu koppeln.

### Lucide React
`lucide-react` liefert Icons für Buttons, Navigation und andere UI-Elemente.

---

## Neu: Routing, Navigation & Redirects (react-router-dom)

### Wo werden Routes definiert?
Die Zuordnung "URL → Seite" passiert in `src/App.tsx` über `<Routes>` und `<Route>`.

- **Layout-Route**: Das gemeinsame Layout (Header + Sidebar + Content) liegt in `AppLayout`.
  Die Kind-Seiten werden über `<Outlet />` in den Content-Bereich gerendert.
- **Index-Route**: `index` entspricht `/` (Dashboard).
- **Weitere Routes**: `fahrten` entspricht `/fahrten`, `fahrer` entspricht `/fahrer`.

### Wo passiert das Weiterleiten (Redirect)?
In `src/App.tsx` gibt es eine Fallback-Route:

- `path="*"` → `<Navigate to="/" replace />`

Das bedeutet: Jede unbekannte URL wird automatisch auf `/` umgeleitet.

### Wie wechselt die App die Seite?
In `src/components/Navigation.tsx` werden Links mit `<NavLink to="...">` verwendet.

- Beim Klick ändert der Router die URL.
- React Router rendert dann automatisch die passende Route/Seite in `<Outlet />`.
- `NavLink` liefert zusätzlich den Active-State, damit der aktuelle Menüpunkt optisch markiert werden kann.

### Wichtig für Deployment / Refresh
Wenn du die App deployed und z. B. direkt `/fahrer` im Browser lädst oder die Seite neu lädst, muss dein Webserver die SPA-Routen auf `index.html` zurückfallen lassen.
Sonst bekommst du bei Refresh häufig ein 404 vom Server.

---

## Neu: Formular + Validierung (react-hook-form + zod)

### Beispiel: Fahrer hinzufügen
In `src/pages/FahrerPage.tsx` gibt es ein kleines Formular, um Fahrer **lokal** zur Liste hinzuzufügen.

**Ablauf im Code:**

1. `useForm()` verwaltet Input-State und Submit-Handling.
2. Über `resolver: zodResolver(fahrerFormSchema)` wird die Zod-Validierung an `react-hook-form` angebunden.
3. Beim Absenden ruft `handleSubmit(...)` den Submit-Handler nur dann auf, wenn die Daten gültig sind.
4. Wenn die Prüfung fehlschlägt:
  - `react-hook-form` füllt automatisch `formState.errors`
  - die Fehlermeldungen erscheinen unter den Inputs (`errors.name`, `errors.telefon`)
5. Wenn die Prüfung erfolgreich ist:
  - der Fahrer wird in einen lokalen State (`extraFahrer`) hinzugefügt
  - das Formular wird mit `reset(...)` geleert

**Wichtig:**
- Das Hinzufügen ist aktuell bewusst "lokal" (nur im Browser-State) und noch nicht im Backend gespeichert.
- Die bestehenden Demo-Daten kommen aus `src/services/api.ts`.

---

## Projektstruktur

Eine sinnvolle Struktur des Frontends sieht z. B. so aus:

```text
src/
├── components/   # Wiederverwendbare UI-Bausteine
├── pages/        # Einzelne Seiten der Anwendung
├── services/     # API-Aufrufe und Datenzugriffe
├── types/        # TypeScript-Typen und Interfaces
├── App.tsx       # Hauptkomponente
├── main.tsx      # Einstiegspunkt der Anwendung
└── index.css     # Globale Styles / Tailwind-Einstieg