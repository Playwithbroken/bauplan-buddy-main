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

- GitHub Actions `CI/CD Pipeline` Run `#53` ist gruen fuer Commit `ecdcd14`.
- Lokal war `npm run quality:desktop-beta:installer` gruen.
- Automatisiert geprueft sind TypeScript, Lint, Jest, Playwright-Beta-Smoke,
  Vite-Build, Desktop-Preflight, unpacked App-Smoke, unsigned Installer-Build,
  Release-Artefaktpruefung, Default-Installationspfad, Silent-Install-Smoke,
  Start der installierten App, Login, echter App-Neustart, Projektpersistenz,
  Backup-Export, Backup-Import, nativer Update-Panel-Check und Cleanup.
- Das manuelle Abnahmeprotokoll liegt in `docs/DESKTOP_BETA_MANUAL_QA.md`.

## Artefakte

- Installer: `release/Bauplan Buddy Setup 0.0.2-beta.17.exe`
- Blockmap: `release/Bauplan Buddy Setup 0.0.2-beta.17.exe.blockmap`
- Updater-Metadaten: `release/beta.yml`
- SHA256: `1B38AF60EF302A6A46E5B76E34FAD76C762778D30BA8417AA244F4F54FB7BCC9`

## Beta-Konten

- `admin@bauplan.de` / `admin123`
- `manager@bauplan.de` / `manager123`
- `user@bauplan.de` / `user123`

Diese Konten sind nur fuer die lokale Desktop-/Demo-Beta vorgesehen.

## Bekannte Einschraenkungen

- Dokumente sind lokale Dokumenteintraege; Datei-Inhalte werden noch nicht
  dauerhaft in der App gespeichert.
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
  SmartScreen-/Trust-Hinweise der unsigned Beta.

## Relevante Dokumente

- `docs/DESKTOP_BETA_STATUS.md`
- `docs/RELEASE_v0.0.1_CHECKLIST.md`
- `docs/DESKTOP_BETA_MANUAL_QA.md`
- `docs/DESKTOP_RELEASE_PIPELINE.md`
