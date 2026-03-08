# Frontend Migration Plan

## Goals

- Replace all LocalStorage-based services with API-backed data.
- Integrate TanStack Query mutations/queries for quotes, projects, delivery notes, and invoices.
- Provide realtime feedback for long-running conversions via WebSocket/SSE.

## Work Breakdown

1. **Infrastructure**
   - Introduce `@/lib/apiClient` wrapper with base URL, auth header, and error handling.
   - Configure TanStack Query client with retry/backoff aligned to backend behaviour.
   - Add WebSocket/SSE listener hook for workflow events (`QuoteConverted`, `ProjectCreated`, etc.).

2. **Quotes Module**
   - Replace `QuoteToProjectService` local generator with API mutation to `POST /quotes/{id}/convert`.
   - Adjust `QuoteToProjectConverter` dialog to consume conversion job state; show progress spinner until `ProjectCreated` event arrives.
   - Add query cache updates: invalidate `projects` list after conversion completes.

3. **Projects Module**
   - Introduce `useProjects` hook backed by `/projects` endpoints.
   - Update project detail pages to fetch phases, milestones via API (remove template generation code from frontend).
   - Implement optimistic updates for status changes with rollback on failure.

4. **Delivery Notes**
   - Swap `DeliveryNoteService` functions for API calls. Persist new notes with `POST /projects/{id}/delivery-notes`.
   - Rework forms to map to `DeliveryNoteCreateRequest` schema; handle validation server errors.
   - Introduce status update mutation hitting `/delivery-notes/{id}/status`.

5. **Invoices**
   - Replace `InvoiceGenerationDialog` data sources with `GET /projects/{id}/invoice-suggestions`.
   - Submit invoices via `POST /projects/{id}/invoices`; handle PDF download from `Location` header or follow-up fetch.
   - Remove LocalStorage numbering logic; display numbers from backend response.

6. **Shared Components**
   - Update Notification/Toast flows to handle API errors (show backend message, fallback to generic text).
   - Centralise date/number formatting consistent with backend expectations.

7. **Testing & QA**
   - Add integration tests using MSW to mock new endpoints until backend is available.
   - Build e2e Playwright scenarios: quote conversion, delivery note creation, invoice issuance, and payment update.
   - Ensure regression coverage for offline mode (mocked with failure responses leading to queued retries if required).

## Dependencies

- Backend endpoints deployed or mocked via MSW/Playwright fixtures.
- Auth tokens available via existing `useAuth` once real backend exists (update when server auth is ready).

## Risks & Mitigations

- **Backend delay**: maintain compatibility layer using feature flags to toggle between mock and live API.
- **Long-running conversions**: Provide cancel/timeout UI, auto-refresh conversion status in background.
- **Data shape drift**: Use generated TypeScript types from OpenAPI to keep client and server aligned.
