import type { ReactNode } from "react";
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
            : "relative mx-auto min-h-[70vh] w-full max-w-[1200px] px-5 pb-8 pt-24 sm:px-7 lg:px-1042"
        }
      >
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
