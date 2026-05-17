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
Release-Artefakte in `release/`.

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

Dokumente sind in dieser Beta lokale Dokumenteintraege. Datei-Inhalte werden
noch nicht dauerhaft in der App gespeichert.

## Bekannte lokale Build-Einschraenkung

`npm run build:desktop:win` kann auf Windows ohne Developer Mode oder ohne
erhoehte Rechte beim Entpacken von `winCodeSign` mit `Cannot create symbolic
link` fehlschlagen. Fuer lokale Beta-Artefakte ist deshalb
`npm run build:desktop:win:unsigned` der reproduzierbare Fallback.

Der Desktop-Smoke nutzt die unpacked App aus `release/win-unpacked` und prueft,
dass der Produktions-Renderer startet.
