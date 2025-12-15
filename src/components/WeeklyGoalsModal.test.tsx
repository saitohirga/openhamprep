import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeeklyGoalsModal } from './WeeklyGoalsModal';

// Mock Supabase
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate,
      insert: mockInsert,
    })),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('WeeklyGoalsModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    userId: 'user-123',
    currentGoals: null,
    onGoalsUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockInsert.mockResolvedValue({ error: null });
  });

  describe('Display', () => {
    it('renders dialog title', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByText('Weekly Study Goals')).toBeInTheDocument();
    });

    it('renders dialog description', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByText('Set your weekly targets to stay on track with your studies.')).toBeInTheDocument();
    });

    it('renders questions per week label', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByText('Questions per week')).toBeInTheDocument();
    });

    it('renders practice tests per week label', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByText('Practice tests per week')).toBeInTheDocument();
    });

    it('renders Save Goals button', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save goals/i })).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Initial Values', () => {
    it('shows default values when currentGoals is null', () => {
      render(<WeeklyGoalsModal {...defaultProps} currentGoals={null} />);

      // Default values are 50 questions and 2 tests
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows current goals values when provided', () => {
      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={{ questions_goal: 100, tests_goal: 5 }}
        />
      );

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Slider Bounds', () => {
    it('displays questions slider min and max labels', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      // Questions slider: min 10, max 200
      // Use getAllByText since '10' appears multiple times (slider min and max for tests)
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('displays tests slider min and max labels', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      // Tests slider: min 1, max 10
      expect(screen.getByText('1')).toBeInTheDocument();
      // '10' appears for both max tests and questions min
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Cancel Button', () => {
    it('calls onOpenChange with false when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(<WeeklyGoalsModal {...defaultProps} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Save Goals - Insert', () => {
    it('inserts new goals when currentGoals is null', async () => {
      const user = userEvent.setup();
      const onGoalsUpdated = vi.fn();

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={null}
          onGoalsUpdated={onGoalsUpdated}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          user_id: 'user-123',
          questions_goal: 50,
          tests_goal: 2,
        });
      });
    });

    it('shows success toast on successful insert', async () => {
      const user = userEvent.setup();

      render(<WeeklyGoalsModal {...defaultProps} currentGoals={null} />);

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Weekly goals updated!');
      });
    });

    it('calls onGoalsUpdated on successful insert', async () => {
      const user = userEvent.setup();
      const onGoalsUpdated = vi.fn();

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={null}
          onGoalsUpdated={onGoalsUpdated}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(onGoalsUpdated).toHaveBeenCalled();
      });
    });

    it('closes dialog on successful insert', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={null}
          onOpenChange={onOpenChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Save Goals - Update', () => {
    it('updates existing goals when currentGoals exists', async () => {
      const user = userEvent.setup();

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={{ questions_goal: 50, tests_goal: 2 }}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({
          questions_goal: 50,
          tests_goal: 2,
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when insert fails', async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValueOnce({ error: new Error('Database error') });

      render(<WeeklyGoalsModal {...defaultProps} currentGoals={null} />);

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save goals');
      });
    });

    it('shows error toast when update fails', async () => {
      const user = userEvent.setup();
      mockEq.mockResolvedValueOnce({ error: new Error('Database error') });

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={{ questions_goal: 50, tests_goal: 2 }}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save goals');
      });
    });

    it('does not call onGoalsUpdated when save fails', async () => {
      const user = userEvent.setup();
      const onGoalsUpdated = vi.fn();
      mockInsert.mockResolvedValueOnce({ error: new Error('Database error') });

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={null}
          onGoalsUpdated={onGoalsUpdated}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      expect(onGoalsUpdated).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables Save button while saving', async () => {
      const user = userEvent.setup();

      // Make the insert hang
      mockInsert.mockImplementation(() => new Promise(() => {}));

      render(<WeeklyGoalsModal {...defaultProps} currentGoals={null} />);

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save goals/i })).toBeDisabled();
      });
    });
  });

  describe('Dialog Closed State', () => {
    it('does not render when open is false', () => {
      render(<WeeklyGoalsModal {...defaultProps} open={false} />);

      expect(screen.queryByText('Weekly Study Goals')).not.toBeInTheDocument();
    });
  });
});
