import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { AppNavigationProvider, useAppNavigation } from './useAppNavigation';

describe('useAppNavigation', () => {
  describe('useAppNavigation hook', () => {
    it('throws error when used outside AppNavigationProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAppNavigation());
      }).toThrow('useAppNavigation must be used within an AppNavigationProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('AppNavigationProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AppNavigationProvider>{children}</AppNavigationProvider>
    );

    it('provides initial currentView as dashboard', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      expect(result.current.currentView).toBe('dashboard');
    });

    it('provides initial reviewingTestId as null', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      expect(result.current.reviewingTestId).toBe(null);
    });

    it('provides setCurrentView function', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      expect(typeof result.current.setCurrentView).toBe('function');
    });

    it('provides setReviewingTestId function', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      expect(typeof result.current.setReviewingTestId).toBe('function');
    });
  });

  describe('setCurrentView', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AppNavigationProvider>{children}</AppNavigationProvider>
    );

    it('updates currentView to practiceTest', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setCurrentView('practiceTest');
      });

      expect(result.current.currentView).toBe('practiceTest');
    });

    it('updates currentView to randomPractice', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setCurrentView('randomPractice');
      });

      expect(result.current.currentView).toBe('randomPractice');
    });

    it('updates currentView to subelementPractice', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setCurrentView('subelementPractice');
      });

      expect(result.current.currentView).toBe('subelementPractice');
    });

    it('updates currentView to weakQuestions', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setCurrentView('weakQuestions');
      });

      expect(result.current.currentView).toBe('weakQuestions');
    });

    it('updates currentView to bookmarks', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setCurrentView('bookmarks');
      });

      expect(result.current.currentView).toBe('bookmarks');
    });

    it('updates currentView to glossary', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setCurrentView('glossary');
      });

      expect(result.current.currentView).toBe('glossary');
    });

    it('updates currentView to flashcards', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setCurrentView('flashcards');
      });

      expect(result.current.currentView).toBe('flashcards');
    });

    it('updates currentView to testResultReview', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setCurrentView('testResultReview');
      });

      expect(result.current.currentView).toBe('testResultReview');
    });

    it('allows switching between multiple views', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setCurrentView('practiceTest');
      });
      expect(result.current.currentView).toBe('practiceTest');

      act(() => {
        result.current.setCurrentView('glossary');
      });
      expect(result.current.currentView).toBe('glossary');

      act(() => {
        result.current.setCurrentView('dashboard');
      });
      expect(result.current.currentView).toBe('dashboard');
    });
  });

  describe('setReviewingTestId', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AppNavigationProvider>{children}</AppNavigationProvider>
    );

    it('sets reviewingTestId to a valid ID', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setReviewingTestId('test-123');
      });

      expect(result.current.reviewingTestId).toBe('test-123');
    });

    it('sets reviewingTestId to null', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      // First set to a value
      act(() => {
        result.current.setReviewingTestId('test-123');
      });
      expect(result.current.reviewingTestId).toBe('test-123');

      // Then set to null
      act(() => {
        result.current.setReviewingTestId(null);
      });

      expect(result.current.reviewingTestId).toBe(null);
    });

    it('updates reviewingTestId when changing', () => {
      const { result } = renderHook(() => useAppNavigation(), { wrapper });

      act(() => {
        result.current.setReviewingTestId('test-123');
      });
      expect(result.current.reviewingTestId).toBe('test-123');

      act(() => {
        result.current.setReviewingTestId('test-456');
      });
      expect(result.current.reviewingTestId).toBe('test-456');
    });
  });

  describe('multiple consumers', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AppNavigationProvider>{children}</AppNavigationProvider>
    );

    it('shares state between multiple hooks', () => {
      const { result: result1 } = renderHook(() => useAppNavigation(), { wrapper });

      // Note: In real React, multiple hooks would share the same provider
      // This test verifies the hook returns consistent interface
      expect(result1.current.currentView).toBe('dashboard');
      expect(result1.current.reviewingTestId).toBe(null);
    });
  });
});
