# Release 0.0.2-beta.17

## Ziel

`0.0.2-beta.17` ist ein lokaler Windows/Electron-Beta-Kandidat fuer Bauplan
Buddy. Der Beta-Scope ist local-first und benoetigt keine Cloud-, Supabase-,
Backend- oder Multi-Tenant-Infrastruktur.

## Stabiler Beta-Scope

- Dashboard
- Projekte
- Angebote
- Rechnungen
- Kalender
- Kunden
- Dokumente
- Einstellungen

Nicht Teil dieser Beta sind produktive Cloud-Team-Nutzung, produktive
Backend-Integration, Admin-Spezialbereiche, unfertige Integrationen und
Realtime-/AI-Demo-Flaechen.

## Abnahme-Status

- `npm run quality:desktop-beta:installer` ist am 26.05.2026 fuer Commit
  `5547f19` gruen gelaufen.
- Automatisiert geprueft sind TypeScript, Lint, Jest, Playwright-Beta-Smoke,
  Vite-Build, Kernmodul-Persistenz, Drucklayout-Persistenz,
  Angebots-/Rechnungs-Druckansicht, lokaler Dokumentimport, Backup-Export,
  Backup-Import und Supportbericht.
- Das Desktop-Installer-Gate prueft zusaetzlich Desktop-Preflight, unpacked
  App-Smoke, unsigned Installer-Build, Release-Artefaktpruefung,
  Authenticode-`NotSigned`-Status, Default-Installationspfad,
  Silent-Install-Smoke, Start der installierten App, Login, echten
  App-Neustart, Projektpersistenz, nativen Update-Panel-Check und Cleanup.
- Das manuelle Abnahmeprotokoll liegt in `docs/DESKTOP_BETA_MANUAL_QA.md`.

## Artefakte

- Installer: `release/Bauplan Buddy Setup 0.0.2-beta.17.exe`
- Blockmap: `release/Bauplan Buddy Setup 0.0.2-beta.17.exe.blockmap`
- Updater-Metadaten: `release/beta.yml`
- SHA256: `53FE500399B49C04A24E03B9480267D897186027182B15F60A8E2A558975274A`

## Beta-Konten

- `admin@bauplan.de` / `admin123`
- `manager@bauplan.de` / `manager123`
- `user@bauplan.de` / `user123`

Diese Konten sind nur fuer die lokale Desktop-/Demo-Beta vorgesehen.

## Bekannte Einschraenkungen

- Dokumente koennen lokal importiert oder verlinkt werden. JSON-Backups
  enthalten Metadaten und Dateipfade, aber noch kein eingebettetes
  Dateiarchiv.
- Briefkopf und Brieffuss sind lokale Beta-Drucklayout-Einstellungen.
  Angebote und Rechnungen koennen eine A4-Druckansicht oeffnen; produktive
  PDF-Nummernkreise, finale Pflichtangaben und GoBD-Pruefung folgen spaeter.
- Der Update-Endpoint ist fuer lokale Beta-Tests nicht produktiv angebunden.
- Der gepackte Desktop-Renderer verwendet einen stabilen lokalen Origin, damit
  die local-first Beta-Daten App-Neustarts ueberstehen.
- `npm run build:desktop:win` kann lokal an `winCodeSign`-Symlink-Rechten
  scheitern. Fuer diese Beta ist `npm run build:desktop:win:unsigned` der
  reproduzierbare lokale Fallback.
- Der Windows-Beta-Installer nutzt explizit NSIS One-Click fuer die lokale
  per-user Installation.
- Die Desktop-Paketidentitaet ist `bauplan-buddy`; alte Template-Pfade wie
  `vite_react_shadcn_ts` gehoeren nicht zum Beta-Artefakt.
- Finale Freigabe benoetigt weiterhin die interaktive Windows-QA ueber den
  One-Click-Start aus Explorer, insbesondere fuer sichtbare
  SmartScreen-/Trust-Hinweise der unsigned Beta und die native
  Druckdialog-Pruefung.

## Relevante Dokumente

- `docs/DESKTOP_BETA_STATUS.md`
- `docs/RELEASE_v0.0.1_CHECKLIST.md`
- `docs/DESKTOP_BETA_MANUAL_QA.md`
- `docs/DESKTOP_RELEASE_PIPELINE.md`
