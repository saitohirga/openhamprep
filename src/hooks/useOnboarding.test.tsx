import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from './useOnboarding';

describe('useOnboarding', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear any mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up window.resetOnboarding
    delete window.resetOnboarding;
  });

  describe('Initial State', () => {
    it('should show onboarding when localStorage has no completion flag', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.hasCompletedOnboarding).toBe(false);
      expect(result.current.showOnboarding).toBe(true);
    });

    it('should not show onboarding when localStorage has completion flag set to true', () => {
      localStorage.setItem('onboarding_completed', 'true');

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.showOnboarding).toBe(false);
    });

    it('should show onboarding when localStorage has completion flag set to false', () => {
      localStorage.setItem('onboarding_completed', 'false');

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.hasCompletedOnboarding).toBe(false);
      expect(result.current.showOnboarding).toBe(true);
    });
  });

  describe('completeOnboarding', () => {
    it('should set localStorage flag and update state when completing onboarding', () => {
      const { result } = renderHook(() => useOnboarding());

      // Initially should show onboarding
      expect(result.current.showOnboarding).toBe(true);

      act(() => {
        result.current.completeOnboarding();
      });

      expect(localStorage.getItem('onboarding_completed')).toBe('true');
      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.showOnboarding).toBe(false);
    });
  });

  describe('skipOnboarding', () => {
    it('should set localStorage flag and update state when skipping onboarding', () => {
      const { result } = renderHook(() => useOnboarding());

      // Initially should show onboarding
      expect(result.current.showOnboarding).toBe(true);

      act(() => {
        result.current.skipOnboarding();
      });

      expect(localStorage.getItem('onboarding_completed')).toBe('true');
      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.showOnboarding).toBe(false);
    });

    it('should behave the same as completeOnboarding', () => {
      const { result: result1 } = renderHook(() => useOnboarding());
      const { result: result2 } = renderHook(() => useOnboarding());

      act(() => {
        result1.current.completeOnboarding();
      });

      localStorage.clear();

      act(() => {
        result2.current.skipOnboarding();
      });

      // Both should result in the same localStorage state
      expect(localStorage.getItem('onboarding_completed')).toBe('true');
    });
  });

  describe('resetOnboarding', () => {
    it('should clear localStorage and reset state', () => {
      // First complete onboarding
      localStorage.setItem('onboarding_completed', 'true');

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.showOnboarding).toBe(false);

      act(() => {
        result.current.resetOnboarding();
      });

      expect(localStorage.getItem('onboarding_completed')).toBeNull();
      expect(result.current.hasCompletedOnboarding).toBe(false);
      expect(result.current.showOnboarding).toBe(true);
    });
  });

  describe('setShowOnboarding', () => {
    it('should allow manually setting showOnboarding state', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.showOnboarding).toBe(true);

      act(() => {
        result.current.setShowOnboarding(false);
      });

      expect(result.current.showOnboarding).toBe(false);

      act(() => {
        result.current.setShowOnboarding(true);
      });

      expect(result.current.showOnboarding).toBe(true);
    });
  });

  describe('Global resetOnboarding function', () => {
    it('should register window.resetOnboarding on mount', () => {
      renderHook(() => useOnboarding());

      expect(window.resetOnboarding).toBeDefined();
      expect(typeof window.resetOnboarding).toBe('function');
    });

    it('should remove window.resetOnboarding on unmount', () => {
      const { unmount } = renderHook(() => useOnboarding());

      expect(window.resetOnboarding).toBeDefined();

      unmount();

      expect(window.resetOnboarding).toBeUndefined();
    });

    it('should clear localStorage when window.resetOnboarding is called', () => {
      localStorage.setItem('onboarding_completed', 'true');

      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      renderHook(() => useOnboarding());

      window.resetOnboarding();

      expect(localStorage.getItem('onboarding_completed')).toBeNull();
      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('Persistence', () => {
    it('should persist completion state across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useOnboarding());

      act(() => {
        result.current.completeOnboarding();
      });

      rerender();

      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.showOnboarding).toBe(false);
    });

    it('should persist completion state across new hook instances', () => {
      const { result: result1 } = renderHook(() => useOnboarding());

      act(() => {
        result1.current.completeOnboarding();
      });

      // Create a new hook instance
      const { result: result2 } = renderHook(() => useOnboarding());

      expect(result2.current.hasCompletedOnboarding).toBe(true);
      expect(result2.current.showOnboarding).toBe(false);
    });
  });
});
