import { useMemo } from "react";
import { useLocation } from "@/app/lib/router";
import { SiteShell } from "@/app/components/shell/site-shell";
import HomePage from "@/app/routes/home";
import RailyardPage from "@/app/routes/railyard";
import RegistryPage from "@/app/routes/registry";
import TemplateModPage from "@/app/routes/template-mod";
import WebsiteSuitePage from "@/app/routes/website";

export default function App() {
  const location = useLocation();
  const pathname = location.pathname;

  const Page = useMemo(() => {
    if (pathname === "/railyard" || pathname.startsWith("/railyard/")) {
      return RailyardPage;
    }

    if (pathname === "/registry" || pathname.startsWith("/registry/")) {
      return RegistryPage;
    }

    if (pathname === "/template-mod" || pathname.startsWith("/template-mod/")) {
      return TemplateModPage;
    }

    if (pathname === "/website" || pathname.startsWith("/website/")) {
      return WebsiteSuitePage;
    }

    return HomePage;
  }, [pathname]);

  return (
    <SiteShell>
      <Page />
    </SiteShell>
  );
}
