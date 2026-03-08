# Backend Implementation Roadmap

## 1. Service Boundaries & Responsibilities

| Service | Responsibility | Tech Stack |
|---------|----------------|------------|
| identity-service | AuthN/AuthZ, JWT issuance, user/role management | Node.js (NestJS/Express) + PostgreSQL (users, roles) or external IdP |
| quote-service | Quotes lifecycle, approval, conversion, publishes `QuoteConverted` | Node.js (NestJS/Fastify) + PostgreSQL (quotes, quote_items) |
| project-service | Project creation from quotes/order confirmations, phases/milestones, listens to `QuoteConverted` | Node.js (NestJS) + PostgreSQL (projects, phases, milestones) |
| delivery-service | Delivery notes, signatures, photos, publishes `DeliveryNoteIssued` | Node.js (NestJS) + PostgreSQL (delivery_notes, items) + S3-compatible storage |
| invoice-service | Invoice generation, numbering, PDF generation, listens to `DeliveryNoteIssued` | Node.js (NestJS) + PostgreSQL (invoices, invoice_items) + PDF service |
| gateway-api | Aggregates endpoints for frontend, handles auth, rate limiting | NestJS/Fastify + GraphQL/REST + API Gateway (optional) |

Shared libraries: `@bauplan/common` with DTOs, event schemas, logging, tracing middleware.

## 2. Technology Choices

- Language: TypeScript across all services for shared types.
- Framework: NestJS for structured modules, DI, and event controllers.
- Database: PostgreSQL with Prisma (schema-first, migrations).
- Messaging: RabbitMQ (durable queues, routing keys per domain event).
- Storage: S3-compatible (MinIO) for PDFs/signatures.
- Containerisation: Docker + Docker Compose for local, Helm charts for Kubernetes in production.
- Configuration: Env vars managed via Vault/Secrets Manager; `.env` only for local.

## 3. Infrastructure & CI/CD

- Repo structure: monorepo (`backend/` with services, `libs/` for shared code) or polyrepo (per service). Monorepo simplifies shared types.
- CI (GitHub Actions):
  - Lint & unit tests per service.
  - Prisma migration check.
  - Docker build & push to registry.
- CD: ArgoCD or GitHub Actions deploying to Kubernetes namespaces (`dev`, `staging`, `prod`).
- Observability: OpenTelemetry SDK, Jaeger for tracing, Prometheus/Grafana for metrics, Loki/ELK for logs.
- Secrets: SOPS or HashiCorp Vault integrated into pipelines.

## 4. Environment Strategy

- Local: Docker Compose spinning up PostgreSQL, RabbitMQ, MinIO, mailhog.
- Dev/Staging: Shared Kubernetes clusters with isolated namespaces, seeded test data.
- Prod: Managed PostgreSQL (e.g., RDS), RabbitMQ cluster (CloudAMQP), S3 storage, CDN for static assets.

## 5. Timeline (High-Level)

1. **Foundation (Sprint 1-2)**: Set up monorepo, common library, identity-service integration (could be stub), scaffolding with NestJS + Prisma, infrastructure as code templates.
2. **Quote-to-Project Flow (Sprint 2-3)**: Implement quote-service endpoints, conversion pipeline, project-service consumer, integration tests, e2e contract tests.
3. **Delivery Notes (Sprint 4)**: Build delivery-service API, connect to project-service, store signatures, emit events.
4. **Invoices (Sprint 5-6)**: Implement invoice-service, PDF generation (jsPDF/puppeteer), connect to delivery notes + milestones.
5. **Gateway & Hardening (Sprint 7)**: Introduce API gateway, finalize auth scopes, add monitoring dashboards, load/security testing.
6. **Production Readiness (Sprint 8)**: Data migration scripts, backup strategy, on-call runbooks, incident response, compliance checks.

## 6. Risks & Mitigations

- Event order/duplication: enforce idempotent event handlers; include event versioning; use outbox pattern.
- Schema drift: adopt schema registry or shared package for DTOs, automated contract tests.
- Security: align with OWASP ASVS; pen test before go-live; enable audit logs for all state changes.
- PDF/signature compliance: ensure timestamping and archival storage to meet legal requirements.

