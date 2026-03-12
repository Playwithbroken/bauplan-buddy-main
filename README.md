# Bauplan Buddy – Construction Management Platform

End-to-end construction project planning suite covering scheduling, document workflows, financial automation, and multi-channel communication. The repository contains the React/Vite frontend and an experimental Node-based microservice backend.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-blue)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue)](#)

## Highlights
- Drag-and-drop calendar with recurring appointments and quiet-hour enforcement
- Invoice and delivery-note automation with export, OCR, and accounting integrations
- Document workspace with templates, versioning, and CAD/BIM hooks
- Offline-ready PWA shell with theme presets and advanced accessibility tooling
- Shared design system based on Radix UI + Tailwind (Shadcn inspired)

## Repository Layout
- `src/` – React application (components, pages, services, utilities)
- `backend/` – Node 20+ workspace for Prisma-driven services (Postgres + RabbitMQ)
- `docs/` – Architecture notes, roadmaps, implementation plans, smoke tests
- `e2e/` – Playwright test suite and fixtures
- `public/` – Static assets and base HTML shell
- `deploy.ps1` – Windows helper for building + shipping to cloud targets

## Prerequisites
- Node.js 20 LTS (use `nvm`/`fnm` or Volta for reproducible installs)
- npm 9+ (Bun is supported via `bun.lockb`, but npm is the primary workflow)
- Docker Desktop (optional) for backend Postgres + RabbitMQ stack
- Playwright browsers: `npx playwright install --with-deps` (Linux/macOS) when running E2E tests locally

## Setup & Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
   _(Alternatively: `bun install`)_
2. Configure environment:
   ```bash
   cp .env.example .env.local
   ```
   Adjust `VITE_API_URL`, `VITE_USE_API`, and `VITE_USE_MOCK_BACKEND` as needed.
3. Start the frontend development server (default http://localhost:5173):
   ```bash
   npm run dev
   ```
4. (Optional) Run the experimental backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   docker compose up -d     # launches Postgres + RabbitMQ
   npm run dev --workspace services/quote-service
   ```
   Additional services live under `backend/services/*` and share libs via npm workspaces.

## Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run build:desktop` | Build desktop artifacts via Electron Builder |
| `npm run build:desktop:win` | Build Windows desktop installer (`.exe`) |
| `npm run build:desktop:mac` | Build macOS desktop installer (`.dmg`) |
| `npm run preflight:desktop-release -- --platform=win|mac --publish=true|false --tag=vX.Y.Z` | Validate release prerequisites (version/tag/secrets) |
| `npm run verify:desktop-release -- --platform=win|mac --dir=release` | Smoke-check desktop release artifacts |
| `npm run preview` | Preview prod build |
| `npm run build:dev` | Build using development mode (faster JS, useful for smoke tests) |
| `npm run build:analyze` | Production build + bundle analyzer report |
| `npm run lint` | ESLint over the project |
| `npm run test` | Jest unit tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:e2e` | Playwright end-to-end suite |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:e2e:report` | Open the latest Playwright report |

## Testing & Quality Gates
- `npm run lint` before committing UI changes to keep Tailwind class ordering consistent.
- `npm run test` covers key services (OCR, invoicing, notification logic). Add coverage for new services in `src/services/__tests__`.
- `npm run test:e2e` validates appointment scheduling, document flows, and notification settings. Use `npm run test:e2e:ui` for debugging.
- Accessibility smoke: run through `docs/smoke-tests/notification-settings-smoke.md` after UI adjustments to dialog flows.

## Deployment
- Quick check before shipping: `npm run build` && `npm run preview`
- Windows helper (`./deploy.ps1`) wraps build + upload steps for Vercel/Netlify.
- Docker workflow:
  ```bash
  docker build -t bauplan-buddy .
  docker run -p 3000:80 bauplan-buddy
  # or docker compose
  docker compose up
  ```
- For Vercel/Netlify: ensure `VITE_USE_API=true` and point to the deployed backend or mock service.

## Documentation Map
- Deployment: `DEPLOYMENT_GUIDE.md`
- Environment reference: `ENVIRONMENT_CONFIG.md`
- Drag & drop overview: `drag-and-drop-implementation-summary.md`
- Testing guides: `FILTERING_TESTING_GUIDE.md`, `TESTING_README.md`
- Reporting pipeline: `ENHANCED_REPORTING.md`
- Backend roadmap: `docs/backend-implementation-roadmap.md`
- Desktop release pipeline: `docs/DESKTOP_RELEASE_PIPELINE.md`

## UI Follow-Up Items
- `src/components/NotificationSettingsDialog.tsx`: No user-facing confirmation when `handleSave` succeeds; add toast/snackbar so the dialog close is not the only signal. Also surface permission errors instead of logging to console.
- `src/components/NotificationSettingsDialog.tsx`: The custom reminder unit picker falls back to a native `<select>`; swap to `Select` from the design system for consistent styling + keyboard behaviour, especially in dark mode.
- `src/components/ui/theme-toggle.tsx`: Clipboard import/export relies on `navigator.clipboard` which fails on non-HTTPS contexts—add a fallback modal or file download and guard with feature detection.
- Global: audit responsive states for dense cards (calendar, notification dialog) on <768px—several sections overflow because of fixed padding; see `docs/roadmaps/notification-system-roadmap.md` for pending polish.

## Known Issues
- Character encoding: Some tooling still misbehaves when non-ASCII umlauts (e.g., "ü", "ö", "ä") appear in source files. Stick to ASCII-friendly spellings (ue/oe/ae) or run encoding cleanup scripts before committing.

## Support
- Automation & deployment scripts: see `DEPLOYMENT_GUIDE.md`
- Environment troubleshooting: `ENVIRONMENT_CONFIG.md`
- For UI regressions, add a smoke test checklist entry under `docs/smoke-tests/`

Ready to ship? Run `npm run build` and then `./deploy.ps1` for guided deployment steps.
