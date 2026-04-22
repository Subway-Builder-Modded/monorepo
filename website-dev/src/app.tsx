import { SiteLayout } from "@/shell";
import { useLocation } from "@/lib/router";
import { DocsRoute, matchDocsRoute } from "@/features/docs";
import { HomePage } from "@/features/home";

function RouteSwitch() {
  const location = useLocation();
  const docsMatch = matchDocsRoute(location.pathname, location.search);
  if (docsMatch.kind !== "none") {
    return <DocsRoute />;
  }

  return <HomePage />;
}

export default function App() {
  return (
    <SiteLayout>
      <RouteSwitch />
    </SiteLayout>
  );
}
