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

GitHub Actions:

- `CI/CD Pipeline` Run `#46` ist gruen fuer Commit `bcf3e8a`.
- Abgedeckt sind `typecheck:beta`, Lint, Jest mit Coverage-Report,
  Vite-Build, Playwright-Beta-Smoke und der Pipeline-Status.
- Die PR-CI ist bewusst auf die lokale Desktop-Beta begrenzt. Legacy-Backend-,
  Cloud-, Sonar- und Docker-Pfade bleiben ausserhalb dieses Beta-Gates.

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

Das Installer-Gate baut zusaetzlich den unsigned NSIS-Installer und prueft die
Release-Artefakte in `release/`. Danach installiert der Installer-Smoke die App
silent in ein lokales Testverzeichnis, startet die installierte EXE, prueft den
Renderer-Start und entfernt die Testinstallation wieder.

## Automatischer Smoke

Der Playwright-Smoke deckt die Kernpfade ab:

- Login und Dashboard
- reduzierte Beta-Navigation
- Projektpersistenz nach Reload
- Erstellen, Bearbeiten, Statuswechsel, Filtern und Reload fuer Kernmodule
- Dokument loeschen mit Bestaetigung
- Angebot und Rechnung als lokale Beta-JSON-Datei exportieren
- Backup exportieren und wiederherstellen
- Supportbericht ohne rohe Datensaetze
- Recovery bei kaputtem lokalen Beta-Speicher
- Viewport-Smoke fuer 1366x768, 1920x1080, 768x1024 und mobile 390x844
- Installer-Smoke mit Silent-Install, Start der installierten App und Cleanup

Dokumente sind in dieser Beta lokale Dokumenteintraege. Datei-Inhalte werden
noch nicht dauerhaft in der App gespeichert.

## Bekannte lokale Build-Einschraenkung

`npm run build:desktop:win` kann auf Windows ohne Developer Mode oder ohne
erhoehte Rechte beim Entpacken von `winCodeSign` mit `Cannot create symbolic
link` fehlschlagen. Fuer lokale Beta-Artefakte ist deshalb
`npm run build:desktop:win:unsigned` der reproduzierbare Fallback.

Der Desktop-Smoke nutzt die unpacked App aus `release/win-unpacked` und prueft,
dass der Produktions-Renderer startet.

## Aktuelles lokales Installer-Artefakt

- Installer: `release/Bauplan Buddy Setup 0.0.2-beta.17.exe`
- Blockmap: `release/Bauplan Buddy Setup 0.0.2-beta.17.exe.blockmap`
- Updater-Metadaten: `release/beta.yml`
- SHA256: `AB921838B09F237B77429F49033D29A0E3E2CE9531538E53360CD6B508142EE0`

Automatisiert geprueft sind Installer-Installation, Start und Cleanup. Die
letzte ausstehende Freigabe ist die manuelle Windows-Installer-QA:
Login, Datenpersistenz nach Neustart, Backup Export/Import und Update-Panel
ohne Crash. Das Abnahmeprotokoll liegt in `docs/DESKTOP_BETA_MANUAL_QA.md`.
