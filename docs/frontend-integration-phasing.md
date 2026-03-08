# Frontend Integration Phasing

Align frontend workstreams with backend deliveries to reduce mocks and rework.

## Phase 1 – Quote → Project (Backend Sprint 2-3)

- Feature flag: `ENABLE_API_QUOTE_CONVERSION`.
- Implement API client + mutation for `POST /quotes/{id}/convert`.
- Update `QuoteToProjectConverter` to poll conversion job or subscribe to SSE channel `projects/updates`.
- Replace `QuoteToProjectService` mock; keep LocalStorage fallback until backend available.
- Add automated tests (MSW stubs) mirroring new API.

## Phase 2 – Project Core Data (Sprint 3)

- Switch project list/detail views to `/projects` API.
- Remove template generation logic client-side; rely on backend response for phases/milestones.
- Introduce caching + optimistic updates for status changes.

## Phase 3 – Delivery Notes (Sprint 4)

- Feature flag: `ENABLE_API_DELIVERY_NOTES`.
- Swap form submission to `POST /projects/{id}/delivery-notes`.
- Implement status updates via `/delivery-notes/{id}/status`.
- Handle signature uploads once backend S3 endpoints ready.

## Phase 4 – Invoices (Sprint 5-6)

- Feature flag: `ENABLE_API_INVOICES`.
- Replace LocalStorage invoice numbering with backend-provided `number`.
- Fetch invoice suggestions (delivery notes, milestones) from API.
- Submit invoices via `POST /projects/{id}/invoices`; download PDF using response location.

## Phase 5 – Realtime & Notifications (Sprint 6-7)

- Hook WebSocket/SSE event stream for `ProjectCreated`, `DeliveryNoteIssued`, `InvoiceIssued` to trigger UI updates.
- Integrate notification center with backend push events.
- Ensure offline queueing disabled when API mode active.

## Phase 6 – Cleanup & Hardening (Sprint 7-8)

- Remove legacy LocalStorage services and sample data initializers.
- Update documentation & onboarding scripts (`README` etc.).
- Add regression e2e flows (Playwright) that cover full order lifecycle with backend mocks.
- Verify RBAC/permission prompts align with Identity service scopes.

## Cross-Cutting Tasks

- Type generation: consume OpenAPI specs via `openapi-typescript`, ensure shared types in `@/types/api`.
- Error handling: unify API error presentation, handle 401/403 redirects to login.
- Analytics: instrument conversion, delivery, invoice events for usage metrics.

