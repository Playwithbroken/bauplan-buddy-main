# Testhandbuch Bauplan Buddy

Dieses Dokument beschreibt die Teststrategie für Web, künftige Electron- und Capacitor-Wrapper sowie den täglichen Umgang mit Unit-, Integrations- und End‑to‑End‑Tests.

---

## 1. Testpyramide & Verantwortlichkeiten

| Ebene | Zweck | Technologie | Owner |
|-------|-------|-------------|-------|
| Unit | Reine Logik, Utilities, Services | Jest (`ts-jest`) | Feature Teams |
| Component | UI-Verhalten, Hooks, Context | Jest + Testing Library | Frontend |
| Integration | Domänen-Workflows (Invoice, Kalender, Drag & Drop) | Jest (`src/__tests__/integration`) | QA & Feature Teams |
| E2E | Nutzerflüsse im Browser | Playwright | QA (Jonas Weber) |
| Smoke | Kurzlauf zur Regression im Freeze | Playwright (`e2e/smoke.spec.ts`) | QA |

Definition of Done für Features: alle relevanten Tests grün, neue Lücken in `docs/flow-inventory.md` dokumentiert, keine `test.skip`.

---

## 2. Testverzeichnis

```
src/
  __tests__/
    components/           → UI/Hook Tests
    integration/          → Workflow-Integrationen
    services/             → Service-Unit-Tests
e2e/                      → Playwright-Spezifikationen
backend/prisma/seed.ts    → Seed für End-to-End-Daten
docs/roadmaps/            → Stabilitäts- & Testpläne
```

Factories/Werkzeuge (Target KW 44): `src/tests/factories/` (siehe Abschnitt 5.3).

---

## 3. Ausführung & Browser-Matrix

### Lokale Läufe
- **Alle Jest-Tests:** `npm test`
- **Gezielte Tests:** `npm test -- src/services/__tests__/deliveryNoteService.test.ts`
- **Watch Mode:** `npm test -- --watch`
- **E2E Smoke:** `npx playwright test e2e/smoke.spec.ts --headed`

### CI-Standard (pro Pull Request)
1. `npm run lint`
2. `npm test -- --runInBand`
3. `npx playwright test e2e/smoke.spec.ts --project=chromium`

### Nightly (Cross-Browser)
- `npx playwright test --project=chromium --project=firefox --project=webkit`
- `npx playwright test --repeat-each=5 e2e/projects.spec.ts e2e/delivery-notes.spec.ts`
- Reports (`playwright-report/results.json`, `results.xml`) als Artefakt hochladen.

Empfehlung: Mobilprofile (Pixel 5, iPhone 12) nur nightly oder bei regressionskritischen Änderungen.

---

## 4. Flaky-Tests & Metriken

### Definition
Flaky = Test schlägt bei mindestens 1 von 20 Wiederholungen fehl, ohne Codeänderung.

### Vorgehen
1. Lauf in CI markiert Test als potentiell flaky → Eintrag in `docs/test-flake-dashboard.md`.
2. Owner analysiert Ursachen (Timing, Race Conditions, Daten).
3. Fix oder Skip mit Ticketlink (STAB-30x). Skip längstens 3 Tage.
4. Nach Fix: `npx playwright test <spec> --repeat-each=20`.

### Aktuelle Kandidaten (Stand 20.10.2025)
- DeliveryNoteManager Component Test (skip) → STAB-202
- Navigation E2E (mobil) → STAB-203
- Offline/Retry Feature (noch manuell) → STAB-204

---

## 5. Testdaten & Seeds

### 5.1 Standard-Seed
`npm run seed` (oder `npx ts-node backend/prisma/seed.ts`) erzeugt:
- Angebot ANG-2025-0001 → Projekt PRJ-2025-0001 → Lieferschein LS-2025-0001 → Rechnung RG-2025-0001.
- Lieferscheine mit vollständigen Positionen.

### 5.2 CI-Seed (Phase 1)
- Skript `npm run seed:test` (geplant) generiert deterministische Daten mit Namensraum `*-TEST-*`.
- Wird vor jedem Playwright-Run ausgeführt (Pipeline Step).

### 5.3 Factories (geplant)
- `src/tests/factories/projectFactory.ts`
- `src/tests/factories/quoteFactory.ts`
- `src/tests/factories/deliveryNoteFactory.ts`
- Generiert per Default konsistente IDs, Datumswerte, Beträge.
- Verwendung: `import { buildProject } from '@/tests/factories/projectFactory';`

---

## 6. Troubleshooting & Tipps

| Problem | Lösung |
|---------|--------|
| Tests hängen | `npx jest --runInBand --detectOpenHandles`, Promises prüfen |
| Mock greift nicht | Mock vor Import definieren, Pfad in `moduleNameMapper` prüfen |
| Playwright findet Elemente nicht | `await page.waitForLoadState('networkidle')`, explizite `data-testid` verwenden |
| Fehlende Logs | `DEBUG=playwright:* npx playwright test` |
| Berechtigungen failen | Seed/Factories stellen Rollen `admin`, `viewer`, `support` bereit |

---

## 7. Wartung

- Wöchentliche Retro: Testdauer, Flake-Statistik, offene Tickets (STAB-20x/30x).
- Monatlich: Nightly-Reports archivieren (`playwright-report/archiv`).
- Änderungen an Testinfrastruktur in `CHANGELOG.md` dokumentieren.

Fragen? QA-Team (Anna Müller, Jonas Weber) oder #team-quality im Slack.
