# Backend Workflow Architecture

## Overview

Bauplan Buddy needs a production ready workflow that links quotes, projects, delivery notes, and invoices. We will introduce independent backend services connected through a shared message bus and a relational database. The frontend will replace all LocalStorage stubs with API calls.

## Services

- Quote Service: manages quotes from draft to approval and publishes `QuoteConverted` events.
- Project Service: creates projects from quotes or order confirmations, manages phases/milestones, and publishes `ProjectCreated` and `ProjectMilestoneCompleted` events.
- Delivery Note Service: issues delivery notes tied to projects, captures signatures, and publishes `DeliveryNoteIssued` events.
- Invoice Service: generates invoices from delivery notes, milestones, or quotes, and publishes `InvoiceIssued`/`InvoicePaid` events.
- Identity Service (existing or external IdP): handles authentication, authorization, and audit logging.

## Data Model Highlights

| Entity | Key Fields | Relationships |
|--------|------------|----------------|
| customers | id, name, billing_address, contact | referenced by quotes, projects, delivery notes, invoices |
| quotes | id, number, customer_id, status, total_amount, valid_until | has many quote_line_items; optional project reference after conversion |
| quote_line_items | id, quote_id, description, quantity, unit_price, category | referenced by project and invoice items |
| projects | id, number, quote_id, customer_id, status, budget, start_date, end_date | has many project_phases, delivery_notes, invoices |
| delivery_notes | id, number, project_id, status, issued_at | has many delivery_note_items |
| invoices | id, number, project_id, status, total_amount, due_date | has many invoice_items referencing delivery_note_items or quote_line_items |

Each service owns its table subset but shares the same relational store or uses well-defined data contracts via an event bus for polyglot persistence.

## Event Flow

1. Sales approves a quote → `POST /quotes/{id}/approve` → `QuoteApproved`.
2. Sales invokes `POST /quotes/{id}/convert` → Quote Service validates state, creates snapshot data, persists conversion metadata, publishes `QuoteConverted`.
3. Project Service consumes `QuoteConverted`, creates project, persists phases/milestones from templates, emits `ProjectCreated`.
4. Logistics issues delivery note via `POST /projects/{id}/delivery-notes` → Delivery Note Service stores note, publishes `DeliveryNoteIssued`.
5. Finance receives `DeliveryNoteIssued`, offers invoice draft via `GET /projects/{id}/invoice-suggestions`, user confirms `POST /projects/{id}/invoices` → Invoice Service stores invoice, emits `InvoiceIssued`.
6. When customer pays, finance updates invoice status `POST /invoices/{id}/status` (paid) → `InvoicePaid`, feeding analytics and project cashflow updates.

All events include correlation IDs to trace a customer order across services.

## Technology Decisions

- API transport: REST (JSON) with OpenAPI definitions. Add gRPC later if needed.
- Database: PostgreSQL with migration tooling (Prisma/TypeORM/Knex). Tables grouped per bounded context.
- Message bus: RabbitMQ (durable queues) or Kafka (topic-based). Initial implementation can use RabbitMQ for simpler routing.
- Auth: OAuth2/OpenID Connect with JWT access tokens, scopes per service (`quotes:convert`, `projects:write`, etc.).
- Observability: central logging (structured JSON), metrics (Prometheus), distributed tracing (OpenTelemetry) to follow events.

## Migration Strategy

1. Stand up backend skeleton with Quote and Project services, implement `/quotes/{id}/convert` and `QuoteConverted` → `ProjectCreated` flow.
2. Replace frontend `QuoteToProjectService` to call backend via TanStack Query mutation. Show conversion progress using WebSocket/SSE notifications.
3. Implement Delivery Note API, switch frontend delivery note dialogs to API. Seed tests for status changes.
4. Add Invoice service, enabling invoice generation from delivery notes/milestones. Sunset LocalStorage invoice numbering.
5. Harden security: audit logs, role checks, input validation using Zod/JOI server-side.
6. Roll out CI/CD and integration tests for end-to-end workflows.
