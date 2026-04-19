import type { ReactNode } from "react";
import { APP_SHELL_OUTER_CONTAINER_CLASS } from "@subway-builder-modded/shared-ui";
import { SiteFooter } from "@/app/components/footer/site-footer";
import { FloatingNavbar } from "@/app/components/navigation/floating-navbar";
import { getActiveSuite } from "@/app/config/site-navigation";
import { useThemeMode } from "@/app/hooks/use-theme-mode";
import { useLocation } from "@/app/lib/router";

type SiteLayoutProps = {
  children: ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const activeSuite = getActiveSuite(pathname);
  const { theme, setTheme } = useThemeMode();

  const isHome = pathname === "/" || pathname === "";

  return (
    <div
      data-color-scheme={activeSuite.colorSchemeId}
      className="relative min-h-screen overflow-x-clip bg-background text-foreground"
    >
      <FloatingNavbar pathname={pathname} theme={theme} setTheme={setTheme} />

      <main
        className={
          isHome
            ? "relative min-h-[70vh] w-full"
            : `relative min-h-[70vh] w-full pb-8 pt-24 ${APP_SHELL_OUTER_CONTAINER_CLASS}`
        }
      >
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
