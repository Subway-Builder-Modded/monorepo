import './style.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

type CrashState = {
  title: string;
  message: string;
  stack?: string;
  componentStack?: string;
};

function CrashScreen({ title, message, stack, componentStack }: CrashState) {
  return (
    <div className="min-h-screen bg-black text-white flex items-start justify-center p-6 overflow-auto">
      <div className="w-full max-w-4xl rounded-xl border border-white/15 bg-white/5 p-5 shadow-2xl">
        <h1 className="text-lg font-semibold text-red-300">{title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm text-white/90">{message}</p>
        {componentStack ? (
          <pre className="mt-4 overflow-auto rounded-lg bg-black/40 p-4 text-xs text-amber-200/90">
            {componentStack}
          </pre>
        ) : null}
        {stack ? (
          <pre className="mt-4 overflow-auto rounded-lg bg-black/40 p-4 text-xs text-white/80">
            {stack}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

let root: ReturnType<typeof createRoot> | null = null;

function renderCrash(state: CrashState) {
  const container = document.getElementById('root');
  if (!container) {
    return;
  }

  if (!root) {
    root = createRoot(container);
  }

  root.render(<CrashScreen {...state} />);
}

class RootErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { crash?: CrashState }
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: unknown): { crash: CrashState } {
    return {
      crash: {
        title: 'React render error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    this.setState({
      crash: {
        title: 'React render error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        componentStack: info.componentStack ?? undefined,
      },
    });
  }

  render() {
    if (this.state.crash) {
      return <CrashScreen {...this.state.crash} />;
    }

    return this.props.children;
  }
}

window.addEventListener('error', (event) => {
  renderCrash({
    title: 'Frontend runtime error',
    message: event.message || 'Unknown error',
    stack: event.error instanceof Error ? event.error.stack : undefined,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : JSON.stringify(reason, null, 2);

  renderCrash({
    title: 'Unhandled promise rejection',
    message,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

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
if (!container) {
  throw new Error('Root container #root was not found');
}

root = createRoot(container);

try {
  root.render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>,
  );
} catch (error) {
  renderCrash({
    title: 'App render failed',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
