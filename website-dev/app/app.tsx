import { SiteLayout } from "@/app/components/layout/site-layout";
import { useLocation } from "@/app/lib/router";
import { matchDocsRoute } from "@/app/features/docs/lib/routing";
import { DocsRoute } from "@/app/features/docs/components";
import HomePage from "@/app/routes/home";

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
