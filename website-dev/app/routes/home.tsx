import { HomeDesignPage } from "@/app/components/pages/home-design-page";
import { SiteShell } from "@/app/components/shell/site-shell";

export default function HomePage() {
  return (
    <SiteShell>
      <HomeDesignPage />
    </SiteShell>
  );
}
