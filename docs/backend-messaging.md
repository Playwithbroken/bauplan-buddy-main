# Messaging & Outbox Guide

## Overview

The backend services emit domain events using a shared messaging library (`@bauplan/messaging`). Services automatically select between an in-memory outbox/publisher (default) and Postgres + RabbitMQ when the corresponding connection strings are provided via environment variables.

- `DATABASE_URL` present → use `PostgresOutboxStore`
- `RABBITMQ_URL` present → use `RabbitMqPublisher`
- otherwise services fall back to in-memory implementations (handy for local tests)

## Components

- **OutboxStore** – abstraction for persisting events. Implementations:
  - `InMemoryOutboxStore` (default fallback)
  - `PostgresOutboxStore` (requires `DATABASE_URL`, automatically ensures the `event_outbox` table and index)
- **MessagePublisher** – abstraction for publishing events.
  - `InMemoryPublisher` (captures messages in memory)
  - `RabbitMqPublisher` (publishes to `workflow.events` topic exchange)
- **OutboxWorker** – polls the store and publishes pending events.

Helper factories `createOutboxStore(connectionString?)` and `createPublisher(amqpUrl?)` encapsulate setup and shutdown logic.

## Schema

`PostgresOutboxStore` expects the table described in `docs/backend-schema-and-events.md` (and will create it if missing):

```sql
CREATE TABLE IF NOT EXISTS event_outbox (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS event_outbox_status_idx ON event_outbox (status, updated_at);
```

## Service Integration

Each service initialises its messaging stack in `src/messaging/outbox.ts`:

```ts
const { store } = createOutboxStore(process.env.DATABASE_URL);
const { publisher } = createPublisher(process.env.RABBITMQ_URL);
const worker = new OutboxWorker(store, publisher, { pollIntervalMs: 500 });
worker.start();
```

Routes enqueue events by creating `OutboxRecord`s – the worker picks them up and publishes to `workflow.events` using routing keys like `quotes.conversion.requested`, `projects.created`, etc.

Shutdown handlers (`SIGINT`, `SIGTERM`) stop the worker and dispose connections.

## Local RabbitMQ

Start via `docker compose up -d`. Use the management UI (`http://localhost:15672`) to inspect exchanges/queues. When working in in-memory mode, helper functions like `getPublishedMessages()` expose captured messages for testing.
