import { useLocation } from "@/lib/router";
import { matchUpdatesRoute } from "@/features/updates/lib/routing";
import { UpdatesHomepage } from "@/features/updates/components/updates-homepage";
import { UpdatePageLayout } from "@/features/updates/components/update-page-layout";
import { FileQuestion } from "lucide-react";

export function UpdatesRoute() {
  const location = useLocation();
  const match = matchUpdatesRoute(location.pathname);

  switch (match.kind) {
    case "homepage":
      return <UpdatesHomepage suiteId={match.suiteId} />;

    case "update":
      return <UpdatePageLayout suiteId={match.suiteId} id={match.slug} />;

    case "not-found":
      return (
        <div className="flex flex-col items-center gap-[clamp(0.65rem,1.5vw,1rem)] py-[clamp(2rem,8vw,5rem)] text-center">
          <FileQuestion
            className="size-[clamp(1.9rem,5.5vw,3rem)] text-muted-foreground"
            aria-hidden="true"
          />
          <h1 className="text-[clamp(1rem,2.2vw,1.2rem)] font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-[clamp(0.85rem,1.2vw,1rem)] text-muted-foreground">{match.reason}</p>
        </div>
      );

    default:
      return null;
  }
}
