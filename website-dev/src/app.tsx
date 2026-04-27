import { SiteLayout } from "@/shell";
import { useLocation } from "@/lib/router";
import { DocsRoute, matchDocsRoute } from "@/features/docs";
import { UpdatesRoute, matchUpdatesRoute } from "@/features/updates";
import { LicenseRoute, matchLicenseRoute } from "@/features/license";
import { CreditsRoute, matchCreditsRoute } from "@/features/credits";
import { ContributeRoute, matchContributeRoute } from "@/features/contribute";
import { CommunityRoute, matchCommunityRoute } from "@/features/community";
import {
  MarkdownPlaygroundRoute,
  matchMarkdownPlaygroundRoute,
} from "@/features/markdown-playground";
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

  const creditsMatch = matchCreditsRoute(location.pathname);
  if (creditsMatch.kind !== "none") {
    return <CreditsRoute />;
  }

  const contributeMatch = matchContributeRoute(location.pathname);
  if (contributeMatch.kind !== "none") {
    return <ContributeRoute />;
  }

  const communityMatch = matchCommunityRoute(location.pathname);
  if (communityMatch.kind !== "none") {
    return <CommunityRoute />;
  }

  const markdownPlaygroundMatch = matchMarkdownPlaygroundRoute(location.pathname);
  if (markdownPlaygroundMatch.kind !== "none") {
    return <MarkdownPlaygroundRoute />;
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
