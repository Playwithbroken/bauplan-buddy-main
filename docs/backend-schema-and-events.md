# Backend Schema & Event Contracts

## Database Schema (Initial)

```sql
-- quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','sent','approved','rejected','converted')),
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quote_items (
  id UUID PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  category TEXT,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  quote_id UUID REFERENCES quotes(id),
  customer_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planning','active','paused','completed','cancelled')),
  budget NUMERIC(12,2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_from JSONB -- {"type":"quote","id":"..."}
);

CREATE TABLE project_phases (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  planned_start DATE,
  planned_end DATE,
  status TEXT NOT NULL CHECK (status IN ('planned','in_progress','completed','delayed')),
  progress SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE project_milestones (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date DATE,
  is_payment BOOLEAN DEFAULT false,
  payment_percentage NUMERIC(5,2),
  status TEXT NOT NULL CHECK (status IN ('pending','reached','invoiced')),
  reached_at TIMESTAMPTZ
);

-- delivery notes
CREATE TABLE delivery_notes (
  id UUID PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','sent','delivered','cancelled')),
  issued_at TIMESTAMPTZ DEFAULT now(),
  signed_at TIMESTAMPTZ,
  signature_path TEXT,
  notes TEXT
);

CREATE TABLE delivery_note_items (
  id UUID PRIMARY KEY,
  delivery_note_id UUID NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
  quote_item_id UUID REFERENCES quote_items(id),
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  delivered_quantity NUMERIC(10,2) NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  total_amount NUMERIC(12,2) NOT NULL,
  subtotal_amount NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  delivery_note_item_id UUID REFERENCES delivery_note_items(id),
  quote_item_id UUID REFERENCES quote_items(id),
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB
);
```

## Event Contracts

Events are JSON payloads published to RabbitMQ exchanges with routing keys `quotes.converted`, `projects.created`, etc. Each event includes metadata for tracing.

```json
// QuoteConverted v1
{
  "eventId": "uuid",
  "eventType": "QuoteConverted",
  "eventVersion": 1,
  "occurredAt": "2025-09-27T10:00:00Z",
  "correlationId": "uuid",
  "quote": {
    "id": "uuid",
    "number": "ANG-2025-0012",
    "customerId": "uuid",
    "totalAmount": 125000,
    "currency": "EUR",
    "requestedStartDate": "2025-10-15",
    "lineItems": [
      {
        "id": "uuid",
        "description": "Stahlträger",
        "quantity": 20,
        "unit": "Stk",
        "unitPrice": 2500,
        "category": "steel_construction"
      }
    ]
  },
  "conversion": {
    "templateId": "steel-hall",
    "options": {
      "autoAssignTeam": true,
      "includeRiskAssessment": true
    }
  }
}
```

```json
// ProjectCreated v1
{
  "eventId": "uuid",
  "eventType": "ProjectCreated",
  "eventVersion": 1,
  "occurredAt": "2025-09-27T10:00:02Z",
  "correlationId": "uuid",
  "project": {
    "id": "uuid",
    "number": "PRJ-2025-0103",
    "quoteId": "uuid",
    "customerId": "uuid",
    "name": "Stahlhalle TechCorp",
    "budget": 125000,
    "startDate": "2025-10-15",
    "endDate": "2026-02-15",
    "phases": [
      {
        "id": "uuid",
        "name": "Planung",
        "order": 1,
        "plannedStart": "2025-10-15",
        "plannedEnd": "2025-11-01"
      }
    ],
    "milestones": [
      {
        "id": "uuid",
        "name": "Anzahlung",
        "dueDate": "2025-10-31",
        "paymentPercentage": 20
      }
    ]
  }
}
```

```json
// DeliveryNoteIssued v1
{
  "eventId": "uuid",
  "eventType": "DeliveryNoteIssued",
  "eventVersion": 1,
  "occurredAt": "2025-11-05T07:45:00Z",
  "correlationId": "uuid",
  "deliveryNote": {
    "id": "uuid",
    "number": "LS-2025-045",
    "projectId": "uuid",
    "customerId": "uuid",
    "issuedAt": "2025-11-05T07:44:00Z",
    "items": [
      {
        "id": "uuid",
        "quoteItemId": "uuid",
        "description": "Stahlträger",
        "quantity": 20,
        "unit": "Stk",
        "deliveredQuantity": 20
      }
    ]
  }
}
```

```json
// InvoiceIssued v1
{
  "eventId": "uuid",
  "eventType": "InvoiceIssued",
  "eventVersion": 1,
  "occurredAt": "2025-11-06T09:15:00Z",
  "correlationId": "uuid",
  "invoice": {
    "id": "uuid",
    "number": "RG-2025-120",
    "projectId": "uuid",
    "customerId": "uuid",
    "totalAmount": 50000,
    "currency": "EUR",
    "issueDate": "2025-11-06",
    "dueDate": "2025-12-06",
    "lineItems": [
      {
        "id": "uuid",
        "deliveryNoteItemId": "uuid",
        "description": "Stahlträger Lieferung 05.11.",
        "quantity": 20,
        "unit": "Stk",
        "unitPrice": 2500,
        "taxRate": 19
      }
    ]
  }
}
```

All events include `eventVersion`; consumers reject unsupported versions. Use JSON Schema for validation and share via `@bauplan/common` package.

## Outbox Pattern

Each service uses an `event_outbox` table to ensure transactionality:

```sql
CREATE TABLE event_outbox (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','published','failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_error TEXT
);
```

A background worker publishes pending events to RabbitMQ and marks them as published. Failed events retry with exponential backoff.

