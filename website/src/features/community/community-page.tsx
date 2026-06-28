import { useEffect, useState } from "react";
import { FileQuestion } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeading, SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { useLocation } from "@/lib/router";
import { getMatchingItem, getSuiteById } from "@/config/site-navigation";
import { matchCommunityRoute } from "@/features/community/lib/routing";
import { loadCommunityPageModel } from "@/features/community/community-data";
import type { CommunityPageModel } from "@/features/community/community-types";
import { CommunityAnalyticsView } from "@/features/community/community-analytics-view";

type CommunityState =
  | { status: "loading" }
  | { status: "ready"; model: CommunityPageModel }
  | { status: "error" };

export function CommunityRoute() {
  const location = useLocation();
  const match = matchCommunityRoute(location.pathname);
  const [state, setState] = useState<CommunityState>({ status: "loading" });

  useEffect(() => {
    if (match.kind !== "page") {
      return;
    }

    let disposed = false;

    async function run() {
      const model = await loadCommunityPageModel();
      if (!disposed) {
        setState({ status: "ready", model });
      }
    }

    run().catch(() => {
      if (!disposed) {
        setState({ status: "error" });
      }
    });

    return () => {
      disposed = true;
    };
  }, [match.kind]);

  if (match.kind !== "page") {
    return null;
  }

  const navItem = getMatchingItem(location.pathname, "general");

  if (!navItem) {
    return (
      <div className="flex flex-col items-center gap-[clamp(0.65rem,1.5vw,1rem)] py-[clamp(2rem,8vw,5rem)] text-center">
        <FileQuestion
          className="size-[clamp(1.9rem,5.5vw,3rem)] text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="text-[clamp(1rem,2.2vw,1.2rem)] font-bold text-foreground">
          Page Not Found
        </h1>
        <p className="text-[clamp(0.85rem,1.2vw,1rem)] text-muted-foreground">
          The page "{location.pathname}" was not found.
        </p>
      </div>
    );
  }

  const Icon = navItem.icon as LucideIcon;
  const suite = getSuiteById(navItem.suiteId);

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-[clamp(1.1rem,3vw,2rem)]" data-testid="community-page">
        <PageHeading icon={Icon} title={navItem.title} description={navItem.description} />

        {state.status === "loading" ? (
          <div className="mt-[clamp(2rem,4vw,3rem)] rounded-3xl border border-border/70 bg-card/70 p-6">
            <p className="text-sm text-muted-foreground">Loading community analytics...</p>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="mt-[clamp(2rem,4vw,3rem)] rounded-3xl border border-border/70 bg-card/70 p-6">
            <p className="text-sm text-muted-foreground">
              Community analytics could not be loaded right now. Please try again shortly.
            </p>
          </div>
        ) : null}

        {state.status === "ready" ? <CommunityAnalyticsView model={state.model} /> : null}
      </section>
    </SuiteAccentScope>
  );
}
