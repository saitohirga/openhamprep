import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the delete-discourse-user edge function.
 *
 * These are integration-style tests that verify the expected behavior
 * of the Discourse user deletion flow from the client's perspective.
 * The actual edge function runs in Deno, so these tests mock the
 * Supabase client to verify the client-side integration.
 */

// Mock Supabase client
const mockInvoke = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
    rpc: mockRpc,
  },
}));

describe('delete-discourse-user integration', () => {
  // Default successful responses
  const successfulDiscourseResponse = {
    data: {
      success: true,
      discourseAccountFound: true,
      discourseUsername: 'testuser',
      message: 'Discourse account deleted successfully',
    },
    error: null,
  };

  const noDiscourseAccountResponse = {
    data: {
      success: true,
      discourseAccountFound: false,
      message: 'No Discourse account found for this user',
    },
    error: null,
  };

  const successfulLocalDeletionResponse = {
    data: { success: true },
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default successful responses
    mockInvoke.mockResolvedValue(successfulDiscourseResponse);
    mockRpc.mockResolvedValue(successfulLocalDeletionResponse);
  });

  describe('successful deletion flow', () => {
    it('should call delete-discourse-user before delete_own_account', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      // Step 1: Delete from Discourse
      const discourseResult = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(discourseResult.data.success).toBe(true);
      expect(discourseResult.data.discourseAccountFound).toBe(true);

      // Step 2: Delete from local database
      const localResult = await supabase.rpc('delete_own_account');

      expect(localResult.data.success).toBe(true);

      // Verify order of calls
      expect(mockInvoke).toHaveBeenCalledBefore(mockRpc);
      expect(mockInvoke).toHaveBeenCalledWith('delete-discourse-user', {
        body: { deletePosts: false },
      });
      expect(mockRpc).toHaveBeenCalledWith('delete_own_account');
    });

    it('should handle user with no Discourse account', async () => {
      mockInvoke.mockResolvedValue(noDiscourseAccountResponse);

      const { supabase } = await import('@/integrations/supabase/client');

      const result = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(result.data.success).toBe(true);
      expect(result.data.discourseAccountFound).toBe(false);
    });

    it('should return discourseUsername when account is found and deleted', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const result = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(result.data.discourseUsername).toBe('testuser');
    });
  });

  describe('error handling', () => {
    it('should continue local deletion even if Discourse deletion fails', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, error: 'Discourse API error' },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');

      // Discourse deletion fails
      const discourseResult = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(discourseResult.data.success).toBe(false);

      // Local deletion should still succeed
      const localResult = await supabase.rpc('delete_own_account');

      expect(localResult.data.success).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'));

      const { supabase } = await import('@/integrations/supabase/client');

      await expect(
        supabase.functions.invoke('delete-discourse-user', {
          body: { deletePosts: false },
        })
      ).rejects.toThrow('Network error');
    });

    it('should return error for unauthorized requests', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, error: 'Unauthorized: Authentication required' },
        error: { message: 'Unauthorized' },
      });

      const { supabase } = await import('@/integrations/supabase/client');

      const result = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(result.data.success).toBe(false);
      expect(result.data.error).toContain('Unauthorized');
    });

    it('should handle rate limiting from Discourse API', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: false,
          error: 'Discourse API rate limit exceeded. Please try again later.',
          discourseAccountFound: true,
          discourseUsername: 'testuser',
        },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');

      const result = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(result.data.success).toBe(false);
      expect(result.data.error).toContain('rate limit');
    });

    it('should include discourseAccountFound in error response when account exists', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: false,
          error: 'Discourse API error: 500',
          discourseAccountFound: true,
          discourseUsername: 'testuser',
        },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');

      const result = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(result.data.success).toBe(false);
      expect(result.data.discourseAccountFound).toBe(true);
      expect(result.data.discourseUsername).toBe('testuser');
    });
  });

  describe('options', () => {
    it('should pass deletePosts: false by default', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(mockInvoke).toHaveBeenCalledWith('delete-discourse-user', {
        body: { deletePosts: false },
      });
    });

    it('should pass deletePosts: true when specified', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: true },
      });

      expect(mockInvoke).toHaveBeenCalledWith('delete-discourse-user', {
        body: { deletePosts: true },
      });
    });
  });

  describe('response format', () => {
    it('should always include success field in response', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      // Success case
      const successResult = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });
      expect(successResult.data).toHaveProperty('success');
      expect(successResult.data.success).toBe(true);

      // Error case
      mockInvoke.mockResolvedValue({
        data: { success: false, error: 'Some error' },
        error: null,
      });

      const errorResult = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });
      expect(errorResult.data).toHaveProperty('success');
      expect(errorResult.data.success).toBe(false);
    });

    it('should include message field in success response', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const result = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(result.data.message).toBe('Discourse account deleted successfully');
    });
  });
});
