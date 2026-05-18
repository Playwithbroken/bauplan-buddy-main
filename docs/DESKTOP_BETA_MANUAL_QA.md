# Desktop Beta Manual QA

Use this checklist for the final interactive Windows QA of
`0.0.2-beta.17`. Automated gates already cover build, typecheck, lint, unit
tests, Playwright beta smoke, unpacked app launch, silent installer install,
installed app launch, and cleanup.

## Test Environment

- Date:
- Tester:
- Windows version:
- Machine:
- Installer:
  `release/Bauplan Buddy Setup 0.0.2-beta.17.exe`
- Installer SHA256:
  `AB921838B09F237B77429F49033D29A0E3E2CE9531538E53360CD6B508142EE0`

## Pre-Checks

- [ ] No existing Bauplan Buddy user installation is present, or it has been
      intentionally backed up before testing.
- [ ] `npm run quality:desktop-beta:installer` has passed on the release
      candidate.
- [ ] GitHub Actions `CI/CD Pipeline` is green for the release candidate branch.
- [ ] The installer, `.blockmap`, and `beta.yml` exist in `release/`.

## Interactive Installer

- [ ] Start `Bauplan Buddy Setup 0.0.2-beta.17.exe` normally from Explorer.
- [ ] Windows SmartScreen or trust warnings are understood for the unsigned
      beta build.
- [ ] Installer completes without crashing.
- [ ] Bauplan Buddy launches from the installed shortcut or installed EXE.
- [ ] App window opens without a crash screen.

## Login And Navigation

- [ ] Log in with `admin@bauplan.de` / `admin123`.
- [ ] Dashboard opens after login.
- [ ] Sidebar shows only beta scope: Dashboard, Projekte, Angebote,
      Rechnungen, Kalender, Kunden, Dokumente, Einstellungen.
- [ ] No visible encoding damage appears in login, dashboard, navigation,
      lists, settings, or error messages.

## Core Data Flow

- [ ] Create one customer.
- [ ] Create one project and connect or reference the customer where available.
- [ ] Edit the project title.
- [ ] Filter the project list and confirm the edited project remains findable.
- [ ] Create one quote and change its status.
- [ ] Export the quote beta JSON file.
- [ ] Create one invoice and change its status.
- [ ] Export the invoice beta JSON file.
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

- [ ] Export a beta backup from Einstellungen.
- [ ] Reset beta data.
- [ ] Import the backup.
- [ ] Confirm restored records are available again.
- [ ] Export a support report.
- [ ] Confirm the support report does not contain raw customer, project,
      quote, invoice, appointment, or document records.

## Update Panel

- [ ] Open Einstellungen.
- [ ] Open or inspect the update panel.
- [ ] Trigger update check where available.
- [ ] Missing update endpoint is shown as a friendly beta limitation, not a
      JSON parse error or crash screen.
- [ ] No app crash occurs after the update check.

## Responsive Visual QA

- [ ] 1366x768 desktop width: login, dashboard, sidebar, lists, dialogs.
- [ ] 1920x1080 desktop width: login, dashboard, sidebar, lists, dialogs.
- [ ] 768px tablet width: sidebar/navigation, dashboard, lists, dialogs.
- [ ] 390px mobile width: login, primary flow, navigation, dialogs.
- [ ] No primary text or buttons overlap at the checked widths.

## Cleanup

- [ ] Uninstall Bauplan Buddy from Windows Apps or the generated uninstaller.
- [ ] Confirm no test installation remains in
      `%LOCALAPPDATA%\Programs\Bauplan Buddy`.
- [ ] Archive exported backup, quote, invoice, and support report if they are
      needed for release evidence.

## Result

- [ ] Pass
- [ ] Pass with known limitations
- [ ] Fail

Notes:

```text

```
