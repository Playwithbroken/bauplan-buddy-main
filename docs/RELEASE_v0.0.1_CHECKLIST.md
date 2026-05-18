# Desktop Beta Release Checklist

Use this checklist for the local Windows/Electron beta build. Current package
version: `0.0.2-beta.17`.

## 1. Pre-release sanity

- Confirm the release branch contains only intended beta-stabilization changes.
- Confirm `release/`, `dist/`, `playwright-report/`, `test-results/`, and local logs are not staged.
- Confirm the beta scope is local-first: Dashboard, Projekte, Angebote, Rechnungen, Kalender, Kunden, Dokumente, Einstellungen.

Commands:

```bash
git status
npm run quality:beta
npm run quality:desktop-beta
npm run quality:desktop-beta:installer
```

The default Playwright beta smoke runs Chromium only. Use
`PLAYWRIGHT_FULL_MATRIX=true npm run test:e2e:legacy` for the wider legacy
browser matrix after installing all Playwright browsers.

## 2. Windows preflight

Run the desktop release preflight without publishing:

```bash
npm run preflight:desktop-release:win
```

For GitHub Actions publishing, confirm signing and publishing secrets are configured
before setting `publish=true`.

## 3. Local installer dry run

```bash
npm run build:desktop:win
```

If this fails while extracting `winCodeSign` with `Cannot create symbolic link`,
enable Windows Developer Mode or run the build from an elevated shell. The app
bundle itself is already validated when `npm run build` and the preflight pass.
For the repeatable local desktop beta gate, run:

```bash
npm run quality:desktop-beta
```

This also launches the unpacked Windows app once and checks that the production
renderer starts.

For a distributable unsigned beta installer, run:

```bash
npm run quality:desktop-beta:installer
```

This final gate also runs `npm run smoke:desktop:win:installer`. The installer
smoke performs a silent install into a local test directory, launches the
installed EXE, waits for the production renderer startup signal, and removes the
test installation again. It refuses to run if an existing local installation is
detected at the default user install path.

Validate artifacts in `release/`:

- Windows installer `.exe`
- updater metadata `beta.yml`
- blockmap file

Current local beta artifact:

- `release/Bauplan Buddy Setup 0.0.2-beta.17.exe`
- SHA256 `AB921838B09F237B77429F49033D29A0E3E2CE9531538E53360CD6B508142EE0`

GitHub PR CI status:

- `CI/CD Pipeline` Run `#42` passed for commit `27ec9c2`.
- This CI gate covers TypeScript, lint, Jest coverage reporting, Vite build,
  and the Playwright beta smoke.

## 4. Manual beta smoke

- Install and launch the Windows app. The automated installer smoke already
  covers silent install, launch, and cleanup; this manual step should use the
  normal interactive installer path.
- Log in with `admin@bauplan.de` / `admin123`.
- Create one project, quote, invoice, appointment, customer, and document entry.
- Edit one project title, filter the project list, and confirm the changed title remains after reload.
- Export one quote and one invoice from the local beta list.
- Delete one document entry and confirm the delete prompt appears.
- Close and restart the app.
- Confirm the entries remain available.
- Export a backup, reset the beta data, and restore the backup.
- Download a support report and confirm it does not contain raw customer/project records.
- Open Einstellungen and reset beta demo data.
- Check the app at 1366x768, 1920x1080, 768x1024, and 390x844 viewport widths.
- Confirm the app shows no crash screen and no visible encoding damage.

## 5. Rollback readiness

- Keep the previous beta installer available.
- If the build is bad, mark the release as draft/prerelease and ship a patched beta.
