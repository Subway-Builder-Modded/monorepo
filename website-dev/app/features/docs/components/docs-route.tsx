import { useLocation, navigate } from "@/app/lib/router";
import { matchDocsRoute } from "@/app/features/docs/lib/routing";
import type { DocsSuiteId } from "@/app/features/docs/config";
import { DocsHomepage } from "./docs-homepage";
import { DocPageLayout } from "./doc-page-layout";
import { FileQuestion } from "lucide-react";
import { useEffect, Component, type ReactNode } from "react";

class DebugErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ whiteSpace: "pre-wrap", padding: 20, color: "red", fontSize: 12 }}>
          {this.state.error.message}{"\n\n"}{this.state.error.stack}
        </pre>
      );
    }
    return this.props.children;
  }
}

export function DocsRoute() {
  const location = useLocation();
  const match = matchDocsRoute(location.pathname, location.search);

  useEffect(() => {
    if (match.kind === "redirect") {
      window.history.replaceState({}, "", match.to);
      window.dispatchEvent(new Event("sbm:navigate"));
    }
  }, [match]);

  const inner = (() => {
    switch (match.kind) {
      case "homepage":
        return (
          <DocsHomepage
            suiteId={match.suiteId}
            version={match.version}
          />
        );

      case "doc":
        return (
          <DocPageLayout
            suiteId={match.suiteId}
            version={match.version}
            slug={match.slug}
          />
        );

      case "redirect":
        return null;

      case "not-found":
        return (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <FileQuestion className="size-12 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-lg font-bold text-foreground">Page Not Found</h1>
            <p className="text-sm text-muted-foreground">{match.reason}</p>
          </div>
        );

      default:
        return null;
    }
  })();

  return <DebugErrorBoundary>{inner}</DebugErrorBoundary>;
}
