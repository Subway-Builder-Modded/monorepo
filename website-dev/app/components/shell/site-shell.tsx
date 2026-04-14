import type { ReactNode } from "react";
import { useLocation } from "@/app/lib/router";
import { SiteFooter } from "@/app/components/footer/site-footer";
import { FloatingNavbar } from "@/app/components/navigation/floating-navbar";
import { getActiveSuite } from "@/app/lib/site-navigation";
import { useThemeMode } from "@/app/hooks/use-theme-mode";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const activeSuite = getActiveSuite(pathname);
  const { theme, setTheme } = useThemeMode();

  return (
    <div
      data-color-scheme={activeSuite.colorSchemeId}
      className="relative min-h-screen overflow-x-clip bg-background text-foreground"
    >
      <FloatingNavbar pathname={pathname} theme={theme} setTheme={setTheme} />

      <main className="relative mx-auto min-h-[70vh] w-full max-w-[1200px] px-5 pb-8 pt-24 sm:px-7 lg:px-10">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
