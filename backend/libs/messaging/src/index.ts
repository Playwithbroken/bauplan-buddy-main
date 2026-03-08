import { connect } from 'amqplib';
import { Pool } from 'pg';

export interface PublishOptions {
  exchange: string;
  routingKey: string;
  persistent?: boolean;
}

export interface MessagePublisher {
  publish<T>(message: T, options: PublishOptions): Promise<void>;
  close(): Promise<void>;
}

export class RabbitMqPublisher implements MessagePublisher {
  private connection?: any;
  private channel?: any;

  constructor(private readonly url: string) {}

  private async ensureConnection(): Promise<void> {
    if (this.connection && this.channel) {
      return;
    }

    this.connection = await connect(this.url);
    this.channel = await this.connection.createChannel();
  }

  async publish<T>(message: T, options: PublishOptions): Promise<void> {
    await this.ensureConnection();

    const { exchange, routingKey, persistent = true } = options;
    const payload = Buffer.from(JSON.stringify(message));

    await this.channel!.assertExchange(exchange, 'topic', { durable: true });
    this.channel!.publish(exchange, routingKey, payload, { persistent });
  }

  async close(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
    this.channel = undefined;
    this.connection = undefined;
  }
}

export class InMemoryPublisher implements MessagePublisher {
  public sentMessages: Array<{ message: unknown; options: PublishOptions }> = [];

  async publish<T>(message: T, options: PublishOptions): Promise<void> {
    this.sentMessages.push({ message, options });
  }

  async close(): Promise<void> {
    this.sentMessages = [];
  }
}

export interface OutboxRecord {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'published' | 'failed';
  attempts: number;
  lastError?: string;
  updatedAt: string;
}

export interface OutboxStore {
  add(record: OutboxRecord): Promise<void>;
  getPending(limit?: number): Promise<OutboxRecord[]>;
  markPublished(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

export class InMemoryOutboxStore implements OutboxStore {
  private records = new Map<string, OutboxRecord>();

  async add(record: OutboxRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async getPending(limit = 50): Promise<OutboxRecord[]> {
    return Array.from(this.records.values())
      .filter(record => record.status === 'pending')
      .slice(0, limit);
  }

  async markPublished(id: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) return;
    record.status = 'published';
    record.updatedAt = new Date().toISOString();
    record.lastError = undefined;
    this.records.set(id, record);
  }

  async markFailed(id: string, error: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) return;
    record.status = 'failed';
    record.attempts += 1;
    record.lastError = error;
    record.updatedAt = new Date().toISOString();
    this.records.set(id, record);
  }
}

export class PostgresOutboxStore implements OutboxStore {
  private readonly tableName: string;
  private readonly ready: Promise<void>;

  constructor(private readonly pool: Pool, tableName = 'event_outbox') {
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid outbox table name');
    }

    this.tableName = tableName;
    this.ready = this.ensureTable();
  }

  private async ensureTable(): Promise<void> {
    const table = this.tableName;
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id UUID PRIMARY KEY,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS ${table}_status_idx
      ON ${table} (status, updated_at)
    `);
  }

  private async ensureReady(): Promise<void> {
    await this.ready;
  }

  async add(record: OutboxRecord): Promise<void> {
    await this.ensureReady();

    const query = `
      INSERT INTO ${this.tableName} (id, event_type, payload, status, attempts, last_error, updated_at)
      VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        event_type = EXCLUDED.event_type,
        payload = EXCLUDED.payload,
        status = EXCLUDED.status,
        attempts = EXCLUDED.attempts,
        last_error = EXCLUDED.last_error,
        updated_at = EXCLUDED.updated_at
    `;

    await this.pool.query(query, [
      record.id,
      record.eventType,
      JSON.stringify(record.payload),
      record.status,
      record.attempts,
      record.lastError ?? null,
      record.updatedAt
    ]);
  }

  async getPending(limit = 50): Promise<OutboxRecord[]> {
    await this.ensureReady();

    const { rows } = await this.pool.query(
      `SELECT id, event_type, payload, status, attempts, last_error, updated_at
       FROM ${this.tableName}
       WHERE status = 'pending'
       ORDER BY updated_at ASC
       LIMIT $1`,
      [limit]
    );

    return rows.map(row => ({
      id: row.id,
      eventType: row.event_type,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
      status: row.status,
      attempts: Number(row.attempts ?? 0),
      lastError: row.last_error ?? undefined,
      updatedAt: row.updated_at.toISOString()
    }));
  }

  async markPublished(id: string): Promise<void> {
    await this.ensureReady();

    await this.pool.query(
      `UPDATE ${this.tableName}
       SET status = 'published', last_error = NULL, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.ensureReady();

    await this.pool.query(
      `UPDATE ${this.tableName}
       SET status = 'failed', attempts = attempts + 1, last_error = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, error]
    );
  }
}

export interface OutboxWorkerConfig {
  pollIntervalMs?: number;
  batchSize?: number;
}

export class OutboxWorker {
  private timer: NodeJS.Timeout | null = null;
  private defaultConfig: Required<OutboxWorkerConfig> = {
    pollIntervalMs: 1000,
    batchSize: 50
  };

  constructor(
    private readonly store: OutboxStore,
    private readonly publisher: MessagePublisher,
    private readonly config: OutboxWorkerConfig = {}
  ) {}

  start(): void {
    if (this.timer) return;
    const settings = { ...this.defaultConfig, ...this.config };
    this.timer = setInterval(() => {
      void this.flush(settings.batchSize);
    }, settings.pollIntervalMs);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private async flush(batchSize: number): Promise<void> {
    const pending = await this.store.getPending(batchSize);
    await Promise.all(
      pending.map(async record => {
        try {
          await this.publisher.publish(record.payload, {
            exchange: 'workflow.events',
            routingKey: record.eventType
          });
          await this.store.markPublished(record.id);
        } catch (error) {
          await this.store.markFailed(record.id, (error as Error).message);
        }
      })
    );
  }
}

export interface StoreFactoryResult {
  store: OutboxStore;
  cleanup: () => Promise<void>;
}

export const createOutboxStore = (connectionString?: string, tableName?: string): StoreFactoryResult => {
  if (connectionString) {
    const pool = new Pool({ connectionString });
    const store = new PostgresOutboxStore(pool, tableName);
    return {
      store,
      cleanup: async () => {
        await pool.end().catch(() => undefined);
      }
    };
  }

  const store = new InMemoryOutboxStore();
  return {
    store,
    cleanup: async () => {
      // nothing to cleanup for in-memory store
    }
  };
};

export interface PublisherFactoryResult {
  publisher: MessagePublisher;
  cleanup: () => Promise<void>;
}

export const createPublisher = (amqpUrl?: string): PublisherFactoryResult => {
  if (amqpUrl) {
    const publisher = new RabbitMqPublisher(amqpUrl);
    return {
      publisher,
      cleanup: async () => {
        await publisher.close();
      }
    };
  }

  const publisher = new InMemoryPublisher();
  return {
    publisher,
    cleanup: async () => {
      await publisher.close();
    }
  };
};
