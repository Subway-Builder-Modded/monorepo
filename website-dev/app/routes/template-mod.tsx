import { RouteShellPage } from "@/app/components/pages/route-shell-page";
import { SiteShell } from "@/app/components/shell/site-shell";

export default function TemplateModPage() {
  return (
    <SiteShell>
      <RouteShellPage title="Template Mod" />
    </SiteShell>
  );
}
