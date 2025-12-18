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
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
