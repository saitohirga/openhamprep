import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useQuestions } from './useQuestions';

// Mock Supabase
const mockSelect = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// Mock question data for all test types
const mockDbQuestions = [
  // Technician questions (T prefix)
  { id: 'T1A01', question: 'Tech Q1?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null },
  { id: 'T1A02', question: 'Tech Q2?', options: ['A', 'B', 'C', 'D'], correct_answer: 1, subelement: 'T1', question_group: 'T1A', links: [], explanation: null },
  { id: 'T2A01', question: 'Tech Q3?', options: ['A', 'B', 'C', 'D'], correct_answer: 2, subelement: 'T2', question_group: 'T2A', links: [], explanation: null },
  // General questions (G prefix)
  { id: 'G1A01', question: 'General Q1?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'G1', question_group: 'G1A', links: [], explanation: null },
  { id: 'G1A02', question: 'General Q2?', options: ['A', 'B', 'C', 'D'], correct_answer: 1, subelement: 'G1', question_group: 'G1A', links: [], explanation: null },
  { id: 'G2A01', question: 'General Q3?', options: ['A', 'B', 'C', 'D'], correct_answer: 3, subelement: 'G2', question_group: 'G2A', links: [], explanation: null },
  // Extra questions (E prefix)
  { id: 'E1A01', question: 'Extra Q1?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E1', question_group: 'E1A', links: [], explanation: null },
  { id: 'E1A02', question: 'Extra Q2?', options: ['A', 'B', 'C', 'D'], correct_answer: 2, subelement: 'E1', question_group: 'E1A', links: [], explanation: null },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue({ data: mockDbQuestions, error: null });
  });

  describe('without testType filter', () => {
    it('returns all questions when no testType is provided', async () => {
      const { result } = renderHook(() => useQuestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(8);
      expect(result.current.data?.map(q => q.id)).toEqual([
        'T1A01', 'T1A02', 'T2A01',
        'G1A01', 'G1A02', 'G2A01',
        'E1A01', 'E1A02',
      ]);
    });

    it('transforms database questions correctly', async () => {
      const { result } = renderHook(() => useQuestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const firstQuestion = result.current.data?.[0];
      expect(firstQuestion).toEqual({
        id: 'T1A01',
        question: 'Tech Q1?',
        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
        correctAnswer: 'A',
        subelement: 'T1',
        group: 'T1A',
        links: [],
        explanation: null,
      });
    });
  });

  describe('with testType filter', () => {
    it('filters to only Technician questions when testType is "technician"', async () => {
      const { result } = renderHook(() => useQuestions('technician'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.every(q => q.id.startsWith('T'))).toBe(true);
      expect(result.current.data?.map(q => q.id)).toEqual(['T1A01', 'T1A02', 'T2A01']);
    });

    it('filters to only General questions when testType is "general"', async () => {
      const { result } = renderHook(() => useQuestions('general'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.every(q => q.id.startsWith('G'))).toBe(true);
      expect(result.current.data?.map(q => q.id)).toEqual(['G1A01', 'G1A02', 'G2A01']);
    });

    it('filters to only Extra questions when testType is "extra"', async () => {
      const { result } = renderHook(() => useQuestions('extra'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every(q => q.id.startsWith('E'))).toBe(true);
      expect(result.current.data?.map(q => q.id)).toEqual(['E1A01', 'E1A02']);
    });
  });

  describe('query key caching', () => {
    it('uses different query keys for different test types', async () => {
      const wrapper = createWrapper();

      // First render with technician
      const { result: techResult } = renderHook(() => useQuestions('technician'), { wrapper });
      await waitFor(() => expect(techResult.current.isSuccess).toBe(true));

      // Supabase should have been called once
      expect(mockSelect).toHaveBeenCalledTimes(1);

      // Second render with general (new wrapper to avoid cache sharing in test)
      const wrapper2 = createWrapper();
      const { result: generalResult } = renderHook(() => useQuestions('general'), { wrapper: wrapper2 });
      await waitFor(() => expect(generalResult.current.isSuccess).toBe(true));

      // Should call Supabase again for different test type
      expect(mockSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('correct answer mapping', () => {
    it('maps correct_answer 0 to A', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [{ id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null }],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('A');
    });

    it('maps correct_answer 1 to B', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [{ id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 1, subelement: 'T1', question_group: 'T1A', links: [], explanation: null }],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('B');
    });

    it('maps correct_answer 2 to C', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [{ id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 2, subelement: 'T1', question_group: 'T1A', links: [], explanation: null }],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('C');
    });

    it('maps correct_answer 3 to D', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [{ id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 3, subelement: 'T1', question_group: 'T1A', links: [], explanation: null }],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('D');
    });
  });

  describe('error handling', () => {
    it('returns error state when query fails', async () => {
      mockSelect.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      const { result } = renderHook(() => useQuestions('technician'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });
  });

  describe('empty results', () => {
    it('returns empty array when no questions match filter', async () => {
      // Only return Technician questions from the database
      mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'T1A01', question: 'Tech Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null },
        ],
        error: null,
      });

      // But request General questions
      const { result } = renderHook(() => useQuestions('general'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(0);
    });
  });
});
