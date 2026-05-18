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

- GitHub Actions `CI/CD Pipeline` Run `#46` ist gruen fuer Commit `bcf3e8a`.
- Lokal war `npm run quality:desktop-beta:installer` gruen.
- Automatisiert geprueft sind TypeScript, Lint, Jest, Playwright-Beta-Smoke,
  Vite-Build, Desktop-Preflight, unpacked App-Smoke, unsigned Installer-Build,
  Release-Artefaktpruefung und Silent-Install-Smoke.
- Das manuelle Abnahmeprotokoll liegt in `docs/DESKTOP_BETA_MANUAL_QA.md`.

## Artefakte

- Installer: `release/Bauplan Buddy Setup 0.0.2-beta.17.exe`
- Blockmap: `release/Bauplan Buddy Setup 0.0.2-beta.17.exe.blockmap`
- Updater-Metadaten: `release/beta.yml`
- SHA256: `AB921838B09F237B77429F49033D29A0E3E2CE9531538E53360CD6B508142EE0`

## Beta-Konten

- `admin@bauplan.de` / `admin123`
- `manager@bauplan.de` / `manager123`
- `user@bauplan.de` / `user123`

Diese Konten sind nur fuer die lokale Desktop-/Demo-Beta vorgesehen.

## Bekannte Einschraenkungen

- Dokumente sind lokale Dokumenteintraege; Datei-Inhalte werden noch nicht
  dauerhaft in der App gespeichert.
- Der Update-Endpoint ist fuer lokale Beta-Tests nicht produktiv angebunden.
- `npm run build:desktop:win` kann lokal an `winCodeSign`-Symlink-Rechten
  scheitern. Fuer diese Beta ist `npm run build:desktop:win:unsigned` der
  reproduzierbare lokale Fallback.
- Finale Freigabe benoetigt weiterhin die interaktive Windows-QA: normaler
  Installer-Dialog, Login, Daten anlegen, App-Neustart, Persistenz,
  Backup Export/Import und Update-Panel ohne Crash.

## Relevante Dokumente

- `docs/DESKTOP_BETA_STATUS.md`
- `docs/RELEASE_v0.0.1_CHECKLIST.md`
- `docs/DESKTOP_BETA_MANUAL_QA.md`
- `docs/DESKTOP_RELEASE_PIPELINE.md`
