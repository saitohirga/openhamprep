import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { GlossaryFlashcards } from './GlossaryFlashcards';

// Mock PostHog
const mockCapture = vi.fn();
vi.mock('@/hooks/usePostHog', () => ({
  usePostHog: vi.fn(() => ({ capture: mockCapture })),
  ANALYTICS_EVENTS: {
    FLASHCARD_SESSION_STARTED: 'flashcard_session_started',
    TERM_MARKED_KNOWN: 'term_marked_known',
    TERM_MARKED_UNKNOWN: 'term_marked_unknown',
  },
}));

// Mock Supabase
const mockSelect = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

const mockTerms = [
  { id: '1', term: 'Antenna', definition: 'Device for transmitting/receiving radio waves', created_at: '2024-01-01' },
  { id: '2', term: 'Band', definition: 'A range of frequencies', created_at: '2024-01-01' },
  { id: '3', term: 'CW', definition: 'Continuous Wave (Morse code)', created_at: '2024-01-01' },
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

describe('GlossaryFlashcards', () => {
  const defaultProps = {
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock chain
    mockOrder.mockResolvedValue({ data: mockTerms, error: null });
    mockSelect.mockReturnValue({ order: mockOrder });
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching terms', () => {
      mockOrder.mockReturnValue(new Promise(() => {}));

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Start Screen', () => {
    it('displays title', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Glossary Flashcards')).toBeInTheDocument();
      });
    });

    it('displays term count', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('3 terms available')).toBeInTheDocument();
      });
    });

    it('displays Back to Glossary button', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to glossary/i })).toBeInTheDocument();
      });
    });

    it('calls onBack when Back to Glossary is clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();

      render(<GlossaryFlashcards onBack={onBack} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to glossary/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /back to glossary/i }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('displays Start Studying button', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });
    });

    it('displays card direction options', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Card Direction')).toBeInTheDocument();
        expect(screen.getByText('Term → Definition')).toBeInTheDocument();
        expect(screen.getByText('Definition → Term')).toBeInTheDocument();
      });
    });
  });

  describe('Mode Selection', () => {
    it('displays both mode options', async () => {
      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Term → Definition')).toBeInTheDocument();
        expect(screen.getByText('Definition → Term')).toBeInTheDocument();
      });
    });

    it('allows clicking on mode options', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Definition → Term')).toBeInTheDocument();
      });

      // Should be able to click without error
      await user.click(screen.getByText('Definition → Term'));

      // The option should still be visible
      expect(screen.getByText('Definition → Term')).toBeInTheDocument();
    });
  });

  describe('Flashcard Study Session', () => {
    it('starts session when Start Studying is clicked', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      // Should now show flashcard view with navigation
      await waitFor(() => {
        expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
      });
    });

    it('captures analytics event when session starts', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(mockCapture).toHaveBeenCalledWith(
          'flashcard_session_started',
          expect.objectContaining({ term_count: 3, mode: 'term-to-definition' })
        );
      });
    });

    it('displays Got It and Need Review buttons during session', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /need review/i })).toBeInTheDocument();
      });
    });

    it('displays progress stats during session', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByText(/0 known/)).toBeInTheDocument();
        expect(screen.getByText(/0 need review/)).toBeInTheDocument();
      });
    });

    it('shows Back button during session', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument();
      });
    });
  });

  describe('Card Flipping', () => {
    it('displays click to reveal text', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByText(/click to reveal answer/i)).toBeInTheDocument();
      });
    });
  });

  describe('Marking Cards', () => {
    it('captures analytics when marking card as known', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /got it/i }));

      expect(mockCapture).toHaveBeenCalledWith(
        'term_marked_known',
        expect.any(Object)
      );
    });

    it('captures analytics when marking card as unknown', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /need review/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /need review/i }));

      expect(mockCapture).toHaveBeenCalledWith(
        'term_marked_unknown',
        expect.any(Object)
      );
    });

    it('updates known count when marking card as known', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByText(/0 known/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /got it/i }));

      await waitFor(() => {
        expect(screen.getByText(/1 known/)).toBeInTheDocument();
      });
    });

    it('updates need review count when marking card as unknown', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        expect(screen.getByText(/0 need review/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /need review/i }));

      await waitFor(() => {
        expect(screen.getByText(/1 need review/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('disables previous button on first card', async () => {
      const user = userEvent.setup();

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start studying/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start studying/i }));

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const prevButton = buttons.find(btn => btn.querySelector('svg.lucide-chevron-left'));
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Empty Terms', () => {
    it('handles empty terms list', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      render(<GlossaryFlashcards {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('0 terms available')).toBeInTheDocument();
      });
    });
  });
});
