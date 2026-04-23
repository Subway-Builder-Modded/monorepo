import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("AppErrorBoundary caught runtime error", error, errorInfo);
  }

  private reloadPage = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "var(--background)",
          color: "var(--foreground)",
          fontFamily: "Segoe UI, Arial, sans-serif",
        }}
      >
        <section
          style={{
            maxWidth: "760px",
            width: "100%",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "20px",
            background: "var(--card)",
          }}
        >
          <h1 style={{ margin: "0 0 10px", fontSize: "20px", lineHeight: 1.3 }}>Runtime error</h1>
          <p style={{ margin: "0 0 12px", opacity: 0.86 }}>
            The app hit an error after load. This prevents the blackscreen and shows the failure
            reason so it can be fixed quickly.
          </p>
          <pre
            style={{
              margin: "0 0 14px",
              padding: "10px",
              borderRadius: "10px",
              background: "var(--muted)",
              border: "1px solid var(--border)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {this.state.message || "Unknown runtime error"}
          </pre>
          <button
            type="button"
            onClick={this.reloadPage}
            style={{
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--secondary)",
              color: "var(--secondary-foreground)",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </section>
      </main>
    );
  }
}
