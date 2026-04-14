import { RouteShellPage } from "@/app/components/pages/route-shell-page";
import { SiteShell } from "@/app/components/shell/site-shell";

export default function HomePage() {
  return (
    <SiteShell>
      <RouteShellPage title="Home" />
    </SiteShell>
  );
}
