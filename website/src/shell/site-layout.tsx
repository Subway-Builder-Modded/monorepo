import type { ReactNode } from "react";
import { SITE_SHELL_CLASS } from "@subway-builder-modded/shared-ui";
import { SiteFooter } from "@/shared/footer/site-footer";
import { FloatingNavbar } from "@/shared/navigation/floating-navbar";
import { getActiveSuite } from "@/config/site-navigation";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { useLocation } from "@/lib/router";

type SiteLayoutProps = {
  children: ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const activeSuite = getActiveSuite(pathname);
  const { theme, setTheme } = useThemeMode();
  usePageMetadata({ pathname });

  return (
    <div
      data-color-scheme={activeSuite.colorSchemeId}
      className="relative min-h-screen overflow-x-clip bg-background text-foreground"
    >
      <FloatingNavbar pathname={pathname} theme={theme} setTheme={setTheme} />

      <main className={`relative min-h-[70vh] w-full pt-12 ${SITE_SHELL_CLASS}`}>{children}</main>

      <SiteFooter />
    </div>
  );
}
