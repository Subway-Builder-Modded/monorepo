import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/app/app";
import { AppErrorBoundary } from "@/app/components/error-boundary";
import { initializeThemeFromStorage } from "@/app/hooks/use-theme-mode";
import "@/app/styles/global.css";

initializeThemeFromStorage();

// Prevent the browser from restoring scroll position on load; the SPA
// handles scrolling itself.
if (typeof history !== "undefined") {
  history.scrollRestoration = "manual";
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing #root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
