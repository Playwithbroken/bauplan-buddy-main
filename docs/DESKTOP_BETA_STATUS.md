# Desktop Beta Status

Stand: `0.0.2-beta.17`

## Beta-Ziel

Bauplan Buddy ist fuer diese Beta eine lokale Windows/Electron-Desktop-App. Die
App laeuft local-first mit `localStorage`-Persistenz und ohne Pflicht auf
Supabase, Backend-API oder Cloud-Synchronisierung.

## Stabiler Beta-Scope

- Dashboard
- Projekte
- Angebote
- Rechnungen
- Kalender
- Kunden
- Dokumente
- Einstellungen

Experimentelle Demo-, Admin- und Integrationsbereiche sind nicht Teil der
sichtbaren Beta-Oberflaeche.

## Lokale Beta-Konten

- `admin@bauplan.de` / `admin123`
- `manager@bauplan.de` / `manager123`
- `user@bauplan.de` / `user123`

Diese Konten sind nur fuer lokale Desktop-/Demo-Beta gedacht.

## Quality-Gates

Lokaler Gate-Stand:

- `npm run quality:desktop-beta:installer` ist am 27.05.2026 mit robustem
  Installer-Smoke-Cleanup gruen gelaufen.
- Abgedeckt sind `typecheck:beta`, Lint, Jest, Playwright-Beta-Smoke,
  Vite-Build, Desktop-Preflight, unpacked App-Smoke, unsigned Installer-Build,
  Release-Artefaktpruefung, Authenticode-`NotSigned`-Status und
  Installer-Smoke.
- Legacy-Backend-, Cloud-, Sonar- und Docker-Pfade bleiben ausserhalb dieses
  lokalen Desktop-Beta-Gates.

Release-Notiz: `docs/RELEASE_0.0.2-beta.17.md`.

Basis-Gate fuer App-Code:

```bash
npm run quality:beta
```

Desktop-Gate mit unpacked Windows-App und Start-Smoke:

```bash
npm run quality:desktop-beta
```

Komplettes lokales Installer-Gate fuer eine unsigned Windows-Beta:

```bash
npm run quality:desktop-beta:installer
```

Das Installer-Gate baut zusaetzlich den unsigned NSIS-Installer, prueft die
Release-Artefakte in `release/` und bestaetigt unter Windows den erwarteten
`NotSigned`-Status des Beta-Installers. Danach prueft der Installer-Smoke
zuerst den paketbasierten Default-Pfad der per-user Installation und
installiert die App anschliessend silent in ein lokales Testverzeichnis. Dort
startet er die installierte EXE, prueft Renderer-Start, Login,
Projektpersistenz nach echtem App-Neustart, Backup-Export, Backup-Import und
den nativen Update-Panel-Check und entfernt die Testinstallationen wieder.

## Automatischer Smoke

Der Playwright-Smoke deckt die Kernpfade ab:

- Login und Dashboard
- reduzierte Beta-Navigation
- Projektpersistenz nach Reload
- Erstellen, Bearbeiten von Titel/Beschreibung/Betrag, Statuswechsel, Filtern
  und Reload fuer Kernmodule
- Deutsche Betragseingaben werden validiert und ohne stilles Verwerfen
  gespeichert.
- Filter mit Trefferanzahl, Zuruecksetzen und Suche ueber Kunde/Projekt-Kontext
  in Kernlisten inklusive modulbezogener Kein-Treffer-Texte
- Statusfilter pro Kernliste mit gemeinsamem Zuruecksetzen
- Sortierung pro Kernliste nach neuestem Eintrag, Name oder Status
- Farbige Status-Badges fuer scanbare Listen in Dashboard und Kernmodulen
- Deutsche Labels fuer Sidebar-Schalter und lokalen Betriebsmodus
- Lokale Beziehungen zwischen Kunde, Projekt und Angebot inklusive Reload und
  kontrolliertem Entfernen verwaister Zuordnungen beim Loeschen
- Dokument loeschen mit Bestaetigung
- Dokument als lokale Desktop-Datei importieren und Metadaten nach Reload
  inklusive Kunde/Projekt-Zuordnung nach Reload behalten
- Angebot und Rechnung inklusive Kunde/Projekt-Kontext als lokale
  Beta-JSON-Datei exportieren
- Briefkopf/Brieffuss, Papierformat, Ausrichtung und Raender lokal bearbeiten,
  nach Reload behalten und in einer Druckansicht fuer Angebote/Rechnungen
  verwenden
- Backup exportieren, Reset-Bestaetigung und Wiederherstellung
- Supportbericht ohne rohe Datensaetze
- Recovery bei kaputtem lokalen Beta-Speicher
- Viewport-Smoke fuer 1366x768, 1920x1080, 768x1024 und mobile 390x844
- Installer-Smoke mit Default-Installationspfad, Silent-Install, Start und
  Neustart der installierten App, Login, Projektpersistenz, Backup-Export,
  Backup-Import, nativem Update-Panel-Check und Cleanup

Dokumente unterstuetzen zwei lokale Dateiarten: `imported` kopiert die Datei in
den app-kontrollierten Bauplan-Buddy-Ordner, `linked` merkt sich den
Originalpfad. Die Dokumentseite zeigt Importiert, Verlinkt und Datei-fehlt
sichtbar an. JSON-Backups sichern Metadaten, Dateipfade und verfuegbare lokale
Dateiinhalte als Beta-Archivdaten. Dateien, die beim Export nicht lesbar sind,
werden als Warnung im Backup protokolliert und in den Einstellungen sichtbar
angezeigt.

## Aktueller Modulstand

- Dashboard: lokale KPI-Uebersicht, offene Aufgaben und Schnellstart.
- Projekte: Statusuebersicht, lokales Projektvolumen, Kundenzuordnung und
  Bereinigung lokaler Projektverweise beim Loeschen.
- Kunden: Kundenstatus, lokale Beziehungen zu Projekten/Angeboten und
  Bereinigung lokaler Kundenverweise beim Loeschen.
- Angebote: Pipeline, lokales Angebotsvolumen, Kunde/Projekt-Kontext,
  JSON-Export und Druckansicht inklusive Kontextdaten.
- Rechnungen: Rechnungsstatus, offene Summe, Kunde/Projekt-Kontext,
  JSON-Export und Druckansicht inklusive Kontextdaten.
- Kalender: Terminstatus, naechster Termin und Kunde/Projekt-Kontext.
- Dokumente: Statusuebersicht, Import, Verlinkung, Oeffnen, Kunde/Projekt-
  Zuordnung und Missing-File-Hinweis fuer lokale Dateien.
- Einstellungen: lokale Datenverwaltung, Backup/Restore, Supportbericht,
  Drucklayout mit Briefkopf/Brieffuss, Papierformat, Ausrichtung, Raendern und
  Update-Panel.

## Drucklayout

Briefkopf, Brieffuss, Papierformat, Ausrichtung und Randmodus werden unter
`Einstellungen > Drucklayout` lokal gespeichert. Angebote und Rechnungen
koennen eine Druckansicht oeffnen, die diese Werte uebernimmt und den nativen
Druckdialog des Betriebssystems nutzt. Drucker, Papierfach, Skalierung und
Zielgeraet werden dort gewaehlt. Das lokale Backup enthaelt die
Drucklayout-Einstellungen.

## Bekannte lokale Build-Einschraenkung

`npm run build:desktop:win` kann auf Windows ohne Developer Mode oder ohne
erhoehte Rechte beim Entpacken von `winCodeSign` mit `Cannot create symbolic
link` fehlschlagen. Fuer lokale Beta-Artefakte ist deshalb
`npm run build:desktop:win:unsigned` der reproduzierbare Fallback.

Der Desktop-Smoke nutzt die unpacked App aus `release/win-unpacked` und prueft,
dass der Produktions-Renderer startet.

Der gepackte Desktop-Renderer nutzt einen stabilen lokalen Origin auf
`127.0.0.1`, damit `localStorage`-Beta-Daten ueber App-Neustarts erreichbar
bleiben.

## Aktuelles lokales Installer-Artefakt

- Installer: `release/Bauplan Buddy Setup 0.0.2-beta.17.exe`
- Blockmap: `release/Bauplan Buddy Setup 0.0.2-beta.17.exe.blockmap`
- Updater-Metadaten: `release/beta.yml`
- SHA256: `F12F9925B131A3EC04141C57995E815649EC11F8601784DABD89A176C21DE8F5`

Automatisiert geprueft sind Default-Installationspfad, Installer-Installation,
Start, Login, echter App-Neustart, Projektpersistenz, Backup-Export,
Backup-Import, nativer Update-Panel-Check und Cleanup. Die letzte ausstehende
Freigabe ist die manuelle Windows-Installer-QA ueber den interaktiven
NSIS-One-Click-Start aus Explorer, insbesondere fuer sichtbare
SmartScreen-/Trust-Hinweise der unsigned Beta und die native
Druckdialog-Pruefung. Das Abnahmeprotokoll liegt in
`docs/DESKTOP_BETA_MANUAL_QA.md`.
