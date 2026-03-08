# Backend Database Guide

## Prisma Setup

- Schema location: `backend/prisma/schema.prisma`
- Generated client: `backend/libs/database/src/generated`
- Wrapper: `@bauplan/database` exports `getPrismaClient()` and generated types

## Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Create / apply migrations (development)
npm run prisma:migrate

# Seed sample data
npm run prisma:seed
```

The commands use the `DATABASE_URL` from `.env`. Ensure Postgres is running (`docker compose up -d`).

## Current Models & Usage

- `Quote`, `QuoteItem` – used by quote-service for conversions
- `Project` – used by project-service for project creation
- `DeliveryNote`, `DeliveryNoteItem` – delivery-service persists notes & updates status
- `Invoice`, `InvoiceItem` – invoice-service creates invoices and lists per project
- `EventOutbox` – feeds messaging outbox worker (see `docs/backend-messaging.md`)

Delivery and invoice services were migrated from in-memory stores to Prisma repositories; all core workflow entities now persist to Postgres. The seed script creates an approved quote, linked project, delivery note, and draft invoice to explore the workflow quickly.
