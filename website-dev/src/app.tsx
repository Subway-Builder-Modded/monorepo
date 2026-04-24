import { SiteLayout } from "@/shell";
import { useLocation } from "@/lib/router";
import { DocsRoute, matchDocsRoute } from "@/features/docs";
import { UpdatesRoute, matchUpdatesRoute } from "@/features/updates";
import { LicenseRoute, matchLicenseRoute } from "@/features/license";
import { HomePage } from "@/features/home";

function RouteSwitch() {
  const location = useLocation();
  const updatesMatch = matchUpdatesRoute(location.pathname);
  if (updatesMatch.kind !== "none") {
    return <UpdatesRoute />;
  }

  const docsMatch = matchDocsRoute(location.pathname, location.search);
  if (docsMatch.kind !== "none") {
    return <DocsRoute />;
  }

  const licenseMatch = matchLicenseRoute(location.pathname);
  if (licenseMatch.kind !== "none") {
    return <LicenseRoute />;
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
