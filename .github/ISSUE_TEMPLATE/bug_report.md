name: Fehler melden
description: Melde einen Fehler in Bürgerbus Digital
title: "[Bug]: "
labels: ["bug"]

body:
  - type: markdown
    attributes:
      value: |
        Danke für deine Meldung. Bitte keine Passwörter, Tokens oder personenbezogenen Daten eintragen.

  - type: textarea
    id: description
    attributes:
      label: Was ist passiert?
      description: Beschreibe den Fehler kurz und verständlich.
      placeholder: Beim Speichern einer Fahrt erscheint eine Fehlermeldung.
    validations:
      required: true

  - type: textarea
    id: reproduce
    attributes:
      label: Schritte zur Reproduktion
      description: Welche Schritte führen zuverlässig zu dem Fehler?
      value: |
        1.
        2.
        3.
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Erwartetes Verhalten
      description: Was hätte stattdessen passieren sollen?
    validations:
      required: true

  - type: dropdown
    id: area
    attributes:
      label: Betroffener Bereich
      options:
        - Dashboard und Fahrten
        - Fahrgäste
        - Fahrer
        - Fahrzeuge
        - Benutzer und Rollen
        - Login oder Profil
        - E-Mail oder Benachrichtigungen
        - Administration
        - Installation oder Deployment
        - Anderer Bereich
    validations:
      required: true

  - type: input
    id: environment
    attributes:
      label: Browser und Gerät
      placeholder: Chrome 138 unter Windows 11

  - type: textarea
    id: logs
    attributes:
      label: Fehlermeldung oder Screenshot
      description: Optional. Bitte sensible Daten vorher entfernen.

  - type: checkboxes
    id: privacy
    attributes:
      label: Datenschutz
      options:
        - label: Ich habe keine Passwörter, Tokens oder personenbezogenen Daten angegeben.
          required: true
