import './style.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

import { LogFrontend } from '../wailsjs/go/main/App';
import App from './App';
import { addLongTaskObserver } from './lib/perf';

// Surface cold-start main-thread freezes in the console.
addLongTaskObserver();

// ── Disable browser zoom (Ctrl +/-, Ctrl 0, Ctrl scroll) ──
document.addEventListener('keydown', (e) => {
  if (
    (e.ctrlKey || e.metaKey) &&
    (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')
  ) {
    e.preventDefault();
  }
});

document.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  },
  { passive: false },
);

document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  { passive: false, capture: true },
);

const preventGestureZoom = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
};

document.addEventListener(
  'gesturestart',
  preventGestureZoom as EventListener,
  true,
);
document.addEventListener(
  'gesturechange',
  preventGestureZoom as EventListener,
  true,
);
document.addEventListener(
  'gestureend',
  preventGestureZoom as EventListener,
  true,
);

document.addEventListener(
  'click',
  (e) => {
    const target = e.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (!(e.ctrlKey || e.metaKey)) {
      return;
    }

    const anchor = target.closest('a');
    if (!anchor) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
  },
  true,
);

document.addEventListener(
  'contextmenu',
  (e) => {
    e.preventDefault();
    e.stopPropagation();
  },
  true,
);

document.addEventListener(
  'mousedown',
  (e) => {
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true,
);

document.addEventListener(
  'auxclick',
  (e) => {
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true,
);

const container = document.getElementById('root');

// Log renderer rerrors that no boundary handles, which could unmount the whole tree and blanks the
// webview.
const root = createRoot(container!, {
  onUncaughtError: (error, errorInfo) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const line = `[error] Uncaught React render error: ${err.message}\n${
      err.stack ?? ''
    }\ncomponentStack:${errorInfo.componentStack ?? ''}`;
    console.error(line);
    try {
      void LogFrontend('error', line);
    } catch {
      // Not running inside Wails (e.g. unit tests); console output is enough.
    }
  },
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
