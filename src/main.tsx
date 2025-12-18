import { createRoot } from "react-dom/client";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { inject } from "@vercel/analytics";
import App from "./App.tsx";
import "./index.css";

// Initialize Vercel Speed Insights
injectSpeedInsights();

// Initialize Vercel Web Analytics
inject();

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Check for updates periodically (every hour)
        setInterval(() => registration.update(), 60 * 60 * 1000);

        // Listen for new service worker versions
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - prompt user to update
                // Using confirm() for simplicity; could be replaced with a toast UI
                if (window.confirm('A new version of Ham Prep is available. Reload to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
