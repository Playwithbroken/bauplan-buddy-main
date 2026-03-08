# Bauplan Backend

Skeleton backend for the Bauplan Buddy workflow. Uses npm workspaces with shared packages (`@bauplan/common`, `@bauplan/database`, `@bauplan/messaging`) and individual services.

## Prerequisites

- Node.js 20+
- npm 9+
- Docker (for local Postgres and RabbitMQ)

## Install

```bash
cd backend
npm install
```

Copy the environment template and adjust values if needed:

```bash
cp .env.example .env
```

## Local Infrastructure

Start Postgres and RabbitMQ locally:

```bash
docker compose up -d
```

- Postgres: `postgresql://bauplan:bauplan@localhost:5432/bauplan`
- RabbitMQ management UI: `http://localhost:15672` (`bauplan` / `bauplan`)

When `DATABASE_URL` and/or `RABBITMQ_URL` are present, services automatically switch from the in-memory outbox/publisher to Postgres + RabbitMQ.

## Database (Prisma)

Generate the Prisma client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

The Prisma schema lives in `prisma/schema.prisma`; the generated client is emitted to `libs/database/src/generated` and re-exported by `@bauplan/database`.

## Available Scripts

- `npm run build` – compile all workspaces.
- `npm run dev --workspace services/<service-name>` – run an individual service in watch mode.

## Shared Libraries

- `@bauplan/common` – DTOs and shared type definitions.
- `@bauplan/database` – Prisma client wrapper.
- `@bauplan/messaging` – RabbitMQ publisher, in-memory publisher, Postgres outbox store, and helper factories.

## Services

| Service | Port | Persistence |
|---------|------|-------------|
| quote-service | 4001 | Prisma (quotes, quote_items) |
| project-service | 4002 | Prisma (projects) |
| delivery-service | 4003 | Prisma (delivery_notes, delivery_note_items) |
| invoice-service | 4004 | Prisma (invoices, invoice_items) |

Key endpoints remain:
- Quotes: `POST /quotes/:quoteId/convert`, `GET /quotes/conversion-jobs/:jobId`
- Projects: `POST /projects`, `GET /projects`, `GET /projects/:projectId`
- Delivery notes: `POST /delivery-notes/projects/:projectId`, `PATCH /delivery-notes/:deliveryNoteId/status`, `GET /delivery-notes/projects/:projectId`
- Invoices: `GET /invoices/projects/:projectId/suggestions`, `POST /invoices/projects/:projectId`, `GET /invoices/projects/:projectId`

All services now persist data via Prisma; messaging events are enqueued through the shared outbox utilities and published via RabbitMQ when configured.
