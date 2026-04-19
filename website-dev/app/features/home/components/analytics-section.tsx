import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";
import { SectionHeader } from "@subway-builder-modded/shared-ui";
import { ANALYTICS_LINKS } from "@/app/features/home/data/homepage-content";
import { useThemeMode } from "@/app/hooks/use-theme-mode";

const HOMEPAGE_SHELL = "mx-auto w-full max-w-[1600px] px-5 sm:px-7 lg:px-10 xl:px-12";

export function AnalyticsSection() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === "dark";

  return (
    <section className={cn("pb-14 lg:pb-20", HOMEPAGE_SHELL)}>
      <SectionHeader
        kicker="Analytics"
        title="Ecosystem at a glance"
        description="Real-time download counts, install trends, and usage data across every project."
      />

      <div className="flex flex-wrap gap-3">
        {ANALYTICS_LINKS.map((link) => {
          const Icon = link.icon;
          const accent = isDark ? link.accent.dark : link.accent.light;
          return (
            <Link
              key={link.href}
              to={link.href}
              className="group inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors"
              style={{
                borderColor: `${accent}30`,
                color: accent,
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = `${accent}12`;
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
