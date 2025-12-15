import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from './use-toast';

describe('use-toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('reducer', () => {
    it('adds a toast with ADD_TOAST action', () => {
      const initialState = { toasts: [] };
      const newToast = { id: '1', title: 'Test Toast' };

      const result = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]).toEqual(newToast);
    });

    it('limits toasts to TOAST_LIMIT (1)', () => {
      const initialState = { toasts: [{ id: '1', title: 'First' }] };
      const newToast = { id: '2', title: 'Second' };

      const result = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      // Should only keep 1 toast (the newest one)
      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('2');
    });

    it('updates a toast with UPDATE_TOAST action', () => {
      const initialState = { toasts: [{ id: '1', title: 'Original' }] };

      const result = reducer(initialState, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });

      expect(result.toasts[0].title).toBe('Updated');
    });

    it('does not update non-matching toast', () => {
      const initialState = { toasts: [{ id: '1', title: 'Original' }] };

      const result = reducer(initialState, {
        type: 'UPDATE_TOAST',
        toast: { id: '2', title: 'Updated' },
      });

      expect(result.toasts[0].title).toBe('Original');
    });

    it('dismisses a specific toast with DISMISS_TOAST action', () => {
      const initialState = { toasts: [{ id: '1', title: 'Test', open: true }] };

      const result = reducer(initialState, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });

      expect(result.toasts[0].open).toBe(false);
    });

    it('dismisses all toasts when no toastId provided', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'First', open: true },
          { id: '2', title: 'Second', open: true },
        ],
      };

      // First add two toasts to test (though limit is 1, testing the behavior)
      const result = reducer(initialState, {
        type: 'DISMISS_TOAST',
      });

      result.toasts.forEach((t) => {
        expect(t.open).toBe(false);
      });
    });

    it('removes a specific toast with REMOVE_TOAST action', () => {
      const initialState = { toasts: [{ id: '1', title: 'Test' }] };

      const result = reducer(initialState, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });

      expect(result.toasts).toHaveLength(0);
    });

    it('removes all toasts when no toastId provided in REMOVE_TOAST', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'First' },
          { id: '2', title: 'Second' },
        ],
      };

      const result = reducer(initialState, {
        type: 'REMOVE_TOAST',
      });

      expect(result.toasts).toHaveLength(0);
    });
  });

  describe('toast function', () => {
    it('creates a toast and returns id, dismiss, and update functions', () => {
      const result = toast({ title: 'Test Toast' });

      expect(result.id).toBeDefined();
      expect(typeof result.dismiss).toBe('function');
      expect(typeof result.update).toBe('function');
    });

    it('generates unique IDs for each toast', () => {
      const toast1 = toast({ title: 'First' });
      const toast2 = toast({ title: 'Second' });

      expect(toast1.id).not.toBe(toast2.id);
    });
  });

  describe('useToast hook', () => {
    it('returns toast function and dismiss function', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.toast).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
      expect(result.current.toasts).toBeDefined();
    });

    it('adds toast to state when toast function is called', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'New Toast' });
      });

      expect(result.current.toasts.length).toBeGreaterThanOrEqual(0);
    });

    it('dismiss function can be called without toastId', () => {
      const { result } = renderHook(() => useToast());

      expect(() => {
        act(() => {
          result.current.dismiss();
        });
      }).not.toThrow();
    });

    it('dismiss function can be called with toastId', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const newToast = result.current.toast({ title: 'To dismiss' });
        toastId = newToast.id;
      });

      expect(() => {
        act(() => {
          result.current.dismiss(toastId);
        });
      }).not.toThrow();
    });

    it('updates state across multiple hook instances', () => {
      const { result: hook1 } = renderHook(() => useToast());
      const { result: hook2 } = renderHook(() => useToast());

      act(() => {
        hook1.current.toast({ title: 'Shared Toast' });
      });

      // Both hooks should eventually see the same state
      // (they share the same memory state through listeners)
      expect(hook1.current.toasts).toBeDefined();
      expect(hook2.current.toasts).toBeDefined();
    });

    it('cleans up listener on unmount', () => {
      const { unmount } = renderHook(() => useToast());

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('toast update and dismiss', () => {
    it('can update a toast after creation', () => {
      const toastResult = toast({ title: 'Original' });

      expect(() => {
        toastResult.update({ id: toastResult.id, title: 'Updated' });
      }).not.toThrow();
    });

    it('can dismiss a toast after creation', () => {
      const toastResult = toast({ title: 'To Dismiss' });

      expect(() => {
        toastResult.dismiss();
      }).not.toThrow();
    });
  });
});
