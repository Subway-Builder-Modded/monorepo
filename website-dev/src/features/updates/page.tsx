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
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <FileQuestion className="size-12 text-muted-foreground" aria-hidden="true" />
          <h1 className="text-lg font-bold text-foreground">Page Not Found</h1>
          <p className="text-sm text-muted-foreground">{match.reason}</p>
        </div>
      );

    default:
      return null;
  }
}
