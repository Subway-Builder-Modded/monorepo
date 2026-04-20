import { Link } from "@/app/lib/router";
import {
  SectionShell,
  SectionHeader,
  TwoColumnSection,
  AnalyticsPreview,
} from "@subway-builder-modded/shared-ui";
import {
  ANALYTICS_LINKS,
  ANALYTICS_PREVIEW,
  ANALYTICS_SECTION,
  getHomeIcon,
  getHomepageSuiteAccent,
} from "@/app/features/home/data/homepage-content";
import { useThemeMode } from "@/app/hooks/use-theme-mode";

function AnalyticsGraphic() {
  const { resolvedTheme } = useThemeMode();

  return (
    <AnalyticsPreview
      title={ANALYTICS_PREVIEW.title}
      xLabels={ANALYTICS_PREVIEW.xLabels}
      yLabels={ANALYTICS_PREVIEW.yLabels}
      series={ANALYTICS_PREVIEW.series}
      resolvedTheme={resolvedTheme}
    />
  );
}

export function AnalyticsSection() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === "dark";

  return (
    <SectionShell>
      <SectionHeader title={ANALYTICS_SECTION.title} description={ANALYTICS_SECTION.description} />

      <TwoColumnSection
        reverseOnDesktop
        className="lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[1920px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
        left={
          <div className="w-full max-w-md min-w-0 text-center lg:text-left">
            <p className="text-[15px] leading-relaxed text-muted-foreground lg:text-[16px] min-[1920px]:text-[17px]">
              {ANALYTICS_SECTION.body}
            </p>
            <div className="mx-auto mt-6 flex w-full max-w-xs flex-col gap-2.5 lg:mx-0 lg:mt-7">
              {ANALYTICS_LINKS.map((link) => {
                const Icon = getHomeIcon(link.icon);
                const accent = getHomepageSuiteAccent(link.accentSuiteId);
                const color = isDark ? accent.dark : accent.light;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-center text-sm font-semibold transition-all hover:brightness-110 lg:justify-start"
                    style={{
                      borderColor: `${color}40`,
                      color,
                      backgroundColor: `${color}08`,
                    }}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        }
        right={
          <div className="w-full max-w-3xl min-w-0">
            <AnalyticsGraphic />
          </div>
        }
      />
    </SectionShell>
  );
}
