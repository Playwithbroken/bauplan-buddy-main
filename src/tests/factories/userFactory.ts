import { randomUUID } from 'crypto';
import type { TestUser } from './types';

export interface UserFactoryOptions {
  name?: string;
  email?: string;
  roles?: string[];
}

export const buildUser = (overrides: UserFactoryOptions = {}): TestUser => ({
  id: randomUUID(),
  name: overrides.name ?? 'Tester:in',
  email: overrides.email ?? 'tester@example.com',
  roles: overrides.roles ?? ['admin']
});
