# Desktop Beta Manual QA

Use this checklist for the final interactive Windows QA of
`0.0.2-beta.17`. Automated gates already cover build, typecheck, lint, unit
tests, Playwright beta smoke, print-layout persistence, print-preview launch,
unpacked app launch, silent installer install, installed app launch, login,
real app restart, project persistence, backup export/import, native
update-panel check, and cleanup.

## Test Environment

- Date:
- Tester:
- Windows version:
- Machine:
- Installer:
  `release/Bauplan Buddy Setup 0.0.2-beta.17.exe`
- Installer SHA256:
  `53FE500399B49C04A24E03B9480267D897186027182B15F60A8E2A558975274A`

## Pre-Checks

- [ ] No existing Bauplan Buddy user installation is present, or it has been
      intentionally backed up before testing.
- [ ] `npm run quality:desktop-beta:installer` has passed on the release
      candidate. Last local pass: 26.05.2026, commit `5547f19`.
- [ ] GitHub Actions `CI/CD Pipeline` is green for the release candidate branch.
- [ ] The installer, `.blockmap`, and `beta.yml` exist in `release/`.

## Interactive Installer

- The current Windows beta uses the explicit NSIS One-Click path. It does not
  use the assisted multi-page installer flow.
- [ ] Start `Bauplan Buddy Setup 0.0.2-beta.17.exe` normally from Explorer.
- [ ] Windows SmartScreen or trust warnings are understood for the unsigned
      beta build.
- [ ] One-Click install completes without crashing.
- [ ] The installed path uses the Bauplan Buddy package identity and no
      `vite_react_shadcn_ts` template directory is created.
- [ ] Bauplan Buddy launches from the installed shortcut or installed EXE.
- [ ] App window opens without a crash screen.

## Login And Navigation

- [ ] Log in with `admin@bauplan.de` / `admin123`.
- [ ] Dashboard opens after login.
- [ ] Sidebar shows only beta scope: Dashboard, Projekte, Angebote,
      Rechnungen, Kalender, Kunden, Dokumente, Einstellungen.
- [ ] No visible encoding damage appears in login, dashboard, navigation,
      lists, settings, or error messages.
- [ ] Dashboard, Projekte, Kunden, Angebote, Rechnungen, Kalender, Dokumente
      and Einstellungen each show a usable local beta overview.

## Core Data Flow

- [ ] Create one customer.
- [ ] Create one project and connect or reference the customer where available.
- [ ] Edit the project title.
- [ ] Filter the project list and confirm the edited project remains findable.
- [ ] Create one quote and change its status.
- [ ] Export the quote beta JSON file.
- [ ] Open the quote print preview and confirm Briefkopf/Brieffuss are visible.
- [ ] Create one invoice and change its status.
- [ ] Export the invoice beta JSON file.
- [ ] Open the invoice print preview and confirm it is printable through the
      native Windows print dialog.
- [ ] Create one calendar appointment.
- [ ] Edit the appointment.
- [ ] Delete the appointment.
- [ ] Create one local document entry.
- [ ] Delete the document entry and confirm the delete prompt appears.

## Persistence

- [ ] Close the app completely.
- [ ] Start the installed app again.
- [ ] Log in again.
- [ ] Confirm created customer, project, quote, invoice, and remaining entries
      are still present.
- [ ] Confirm the edited project title and status changes persisted.

## Backup And Support

- [ ] Edit Briefkopf and Brieffuss under Einstellungen > Drucklayout.
- [ ] Reload the app and confirm the Drucklayout values remain present.
- [ ] Export a beta backup from Einstellungen.
- [ ] Reset beta data.
- [ ] Import the backup.
- [ ] Confirm restored records are available again.
- [ ] Confirm restored Briefkopf and Brieffuss are available again.
- [ ] Export a support report.
- [ ] Confirm the support report does not contain raw customer, project,
      quote, invoice, appointment, or document records.

## Update Panel

- Automated installer QA already triggers the native Electron update check and
  expects the local beta limitation text instead of a technical endpoint error.
- [ ] Open Einstellungen.
- [ ] Open or inspect the update panel.
- [ ] Trigger update check where available.
- [ ] Missing update endpoint is shown as a friendly beta limitation, not a
      JSON parse error or crash screen.
- [ ] No app crash occurs after the update check.

## Responsive Visual QA

- [ ] 1366x768 desktop width: login, dashboard, sidebar, module overviews,
      lists, settings, dialogs.
- [ ] 1920x1080 desktop width: login, dashboard, sidebar, module overviews,
      lists, settings, dialogs.
- [ ] 768px tablet width: sidebar/navigation, dashboard, module overviews,
      lists, settings, dialogs.
- [ ] 390px mobile width: login, primary flow, navigation, module overviews,
      settings, dialogs.
- [ ] No primary text or buttons overlap at the checked widths.

## Cleanup

- [ ] Uninstall Bauplan Buddy from Windows Apps or the generated uninstaller.
- [ ] Confirm no test installation remains in
      `%LOCALAPPDATA%\Programs\bauplan-buddy`.
- [ ] Archive exported backup, quote, invoice, and support report if they are
      needed for release evidence.

## Result

- [ ] Pass
- [ ] Pass with known limitations
- [ ] Fail

Notes:

```text

```
