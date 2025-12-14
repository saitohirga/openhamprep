import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

// Global function to reset onboarding - exposed for console access
declare global {
  interface Window {
    resetOnboarding: () => void;
  }
}

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    const isCompleted = completed === 'true';
    setHasCompletedOnboarding(isCompleted);

    // Show onboarding if not completed
    if (!isCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  }, []);

  const skipOnboarding = useCallback(() => {
    // Same as completing - user chose to skip, don't show again
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    // For testing/debugging - allows re-showing onboarding
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    setHasCompletedOnboarding(false);
    setShowOnboarding(true);
  }, []);

  // Register global console command for testing
  useEffect(() => {
    window.resetOnboarding = () => {
      localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      console.log('🎉 Onboarding reset! Refreshing page...');
      window.location.reload();
    };

    // Log availability in development
    if (import.meta.env.DEV) {
      console.log('💡 Tip: Run resetOnboarding() in console to restart the onboarding tour');
    }

    return () => {
      delete window.resetOnboarding;
    };
  }, []);

  return {
    hasCompletedOnboarding,
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}
