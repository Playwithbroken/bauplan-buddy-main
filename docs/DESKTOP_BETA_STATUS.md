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

- `npm run quality:desktop-beta:installer` ist am 26.05.2026 fuer Commit
  `5547f19` gruen gelaufen.
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
- Erstellen, Bearbeiten, Statuswechsel, Filtern und Reload fuer Kernmodule
- Dokument loeschen mit Bestaetigung
- Dokument als lokale Desktop-Datei importieren und Metadaten nach Reload
  behalten
- Angebot und Rechnung als lokale Beta-JSON-Datei exportieren
- Briefkopf/Brieffuss lokal bearbeiten, nach Reload behalten und in einer
  Druckansicht fuer Angebote/Rechnungen verwenden
- Backup exportieren und wiederherstellen
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
werden als Warnung im Backup protokolliert.

## Aktueller Modulstand

- Dashboard: lokale KPI-Uebersicht, offene Aufgaben und Schnellstart.
- Projekte: Statusuebersicht, lokales Projektvolumen und Beta-Kontext.
- Kunden: Kundenstatus und lokale Beziehungsbasis fuer Projekte/Angebote.
- Angebote: Pipeline, lokales Angebotsvolumen, JSON-Export und Druckansicht.
- Rechnungen: Rechnungsstatus, offene Summe, JSON-Export und Druckansicht.
- Kalender: Terminstatus, naechster Termin und lokaler Kontext.
- Dokumente: Statusuebersicht, Import, Verlinkung, Oeffnen und
  Missing-File-Hinweis fuer lokale Dateien.
- Einstellungen: lokale Datenverwaltung, Backup/Restore, Supportbericht,
  Drucklayout mit Briefkopf/Brieffuss und Update-Panel.

## Drucklayout

Briefkopf und Brieffuss werden unter `Einstellungen > Drucklayout` lokal
gespeichert. Angebote und Rechnungen koennen eine A4-Druckansicht oeffnen, die
den nativen Druckdialog des Betriebssystems nutzt. Drucker, Papierfach,
Skalierung und Zielgeraet werden dort gewaehlt. Das lokale Backup enthaelt die
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
- SHA256: `53FE500399B49C04A24E03B9480267D897186027182B15F60A8E2A558975274A`

Automatisiert geprueft sind Default-Installationspfad, Installer-Installation,
Start, Login, echter App-Neustart, Projektpersistenz, Backup-Export,
Backup-Import, nativer Update-Panel-Check und Cleanup. Die letzte ausstehende
Freigabe ist die manuelle Windows-Installer-QA ueber den interaktiven
NSIS-One-Click-Start aus Explorer, insbesondere fuer sichtbare
SmartScreen-/Trust-Hinweise der unsigned Beta und die native
Druckdialog-Pruefung. Das Abnahmeprotokoll liegt in
`docs/DESKTOP_BETA_MANUAL_QA.md`.
