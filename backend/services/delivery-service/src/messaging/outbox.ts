import crypto from 'crypto';
import {
  OutboxRecord,
  OutboxWorker,
  createOutboxStore,
  createPublisher,
  InMemoryPublisher
} from '@bauplan/messaging';

const { store, cleanup: cleanupStore } = createOutboxStore(process.env.DATABASE_URL);
const { publisher, cleanup: cleanupPublisher } = createPublisher(process.env.RABBITMQ_URL);

const worker = new OutboxWorker(store, publisher, { pollIntervalMs: 500 });
worker.start();

const inMemoryPublisher = publisher instanceof InMemoryPublisher ? publisher : null;

const shutdown = async () => {
  worker.stop();
  await Promise.allSettled([cleanupStore(), cleanupPublisher()]);
};

['SIGINT', 'SIGTERM'].forEach(signal => {
  process.once(signal, () => {
    shutdown().catch(error => {
      console.error('delivery-service messaging shutdown failed', error);
    });
  });
});

export const enqueueDeliveryEvent = async (eventType: string, payload: Record<string, unknown>) => {
  const record: OutboxRecord = {
    id: crypto.randomUUID(),
    eventType,
    payload,
    status: 'pending',
    attempts: 0,
    updatedAt: new Date().toISOString()
  };

  await store.add(record);
};

export const getPublishedDeliveryEvents = () => inMemoryPublisher?.sentMessages ?? [];
