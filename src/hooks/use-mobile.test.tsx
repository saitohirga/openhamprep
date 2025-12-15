import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth;
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let changeHandler: (() => void) | null = null;

  beforeEach(() => {
    changeHandler = null;
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
  });

  it('returns false for desktop viewport (>= 768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('returns true for mobile viewport (< 768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 500,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('returns false at exactly 768px (boundary)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 768,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('returns true at 767px (just below boundary)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 767,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('creates media query with correct breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    renderHook(() => useIsMobile());

    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('adds event listener on mount', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    renderHook(() => useIsMobile());

    const mqlInstance = mockMatchMedia.mock.results[0].value;
    expect(mqlInstance.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes event listener on unmount', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    const { unmount } = renderHook(() => useIsMobile());
    const mqlInstance = mockMatchMedia.mock.results[0].value;

    unmount();

    expect(mqlInstance.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('updates state when viewport changes', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate viewport change to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 500,
      });
      if (changeHandler) {
        changeHandler();
      }
    });

    expect(result.current).toBe(true);
  });
});
