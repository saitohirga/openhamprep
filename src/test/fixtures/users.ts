import type { User } from '@supabase/supabase-js';

/**
 * Mock user data for testing authentication and user-related features
 */

export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
};

export const mockAdminUser: User = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  app_metadata: { role: 'admin' },
  user_metadata: {},
};

export const mockAnonymousUser = null;

/**
 * Create a custom mock user with specific properties
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    ...mockUser,
    ...overrides,
  };
}
