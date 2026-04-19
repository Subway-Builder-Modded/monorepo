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
        className="xl:mx-auto xl:max-w-[1180px] xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-12"
        left={
          <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center lg:mx-0 lg:mr-auto lg:max-w-md lg:items-start lg:text-left">
            <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              {ANALYTICS_SECTION.body}
            </p>
            <div className="mt-6 flex w-full flex-col gap-2.5 sm:max-w-xs lg:mt-7">
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
          <div className="mx-auto w-full max-w-3xl lg:mx-0 lg:max-w-none">
            <AnalyticsGraphic />
          </div>
        }
      />
    </SectionShell>
  );
}
