import { useMemo, useState } from "react";
import { BarChart3, Users } from "lucide-react";
import { DiscordIcon, resolveIcon } from "@subway-builder-modded/icons";
import {
  DirectoryCard,
  SectionSeparator,
  SuiteAccentButton,
} from "@subway-builder-modded/shared-ui";
import { AnalyticsLineChart } from "@subway-builder-modded/analytics";
import { cn } from "@/lib/utils";
import { COMMUNITY_DISCORD_LINK, COMMUNITY_VALUES } from "@/config/community";
import type {
  CommunityPageModel,
  CommunityPeriod,
  CommunityTimedPeriod,
} from "@/features/community/community-types";

const ALL_PERIODS: CommunityPeriod[] = ["3d", "7d", "14d", "all"];

function periodLabel(period: CommunityPeriod): string {
  return period === "all" ? "All Time" : period;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDelta(value: number | null): string {
  if (value === null) return "n/a";
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
}

function renderIcon(iconName: string, className = "size-4") {
  try {
    const Icon = resolveIcon(iconName);
    return <Icon className={className} aria-hidden={true} />;
  } catch {
    return <Users className={className} aria-hidden={true} />;
  }
}

function MetricDirectoryCard({
  title,
  value,
  icon,
  valueClassName,
}: {
  title: string;
  value: string;
  icon: string;
  valueClassName?: string;
}) {
  return (
    <DirectoryCard
      alignment="top"
      interactive={false}
      showChevron={false}
      icon={renderIcon(icon, "size-3.5")}
      iconClassName="text-muted-foreground opacity-100 dark:text-muted-foreground"
      heading={
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {title}
          </p>
          <p
            className={cn(
              "mt-1.5 text-xl font-semibold tracking-tight text-foreground",
              valueClassName,
            )}
          >
            {value}
          </p>
        </div>
      }
      className="rounded-2xl border border-border/70 bg-card/75 p-2"
      contentClassName="items-start"
    />
  );
}

export function CommunityAnalyticsView({ model }: { model: CommunityPageModel }) {
  const [period, setPeriod] = useState<CommunityPeriod>("7d");

  const active = useMemo(() => {
    if (period === "all" || !model.periods) return null;
    return model.periods[period as CommunityTimedPeriod];
  }, [model.periods, period]);

  if (!model.hasServerData) {
    return (
      <div className="mt-[clamp(2rem,4vw,3rem)] rounded-3xl border border-border/70 bg-card/70 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Community analytics unavailable
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Cached community analytics were not found in the current deploy output. The Discord hub is
          still open while metrics cache data is prepared.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <SuiteAccentButton tone="solid" asChild>
            <a
              href={COMMUNITY_DISCORD_LINK}
              target="_blank"
              rel="noopener noreferrer"
             
            >
              Join Discord
            </a>
          </SuiteAccentButton>
        </div>
      </div>
    );
  }

  const chartPoints = period === "all" ? model.allTimePoints : (active?.points ?? []);

  const growthData =
    period === "all"
      ? chartPoints.map((p) => ({
          date: p.date,
          Members: p.totalUsers,
        }))
      : active
        ? (() => {
            const hasReferencePoint =
              chartPoints.length > 0 && chartPoints[0]?.date < active.fromDate;
            const startIndex = hasReferencePoint ? 1 : 0;

            return chartPoints.slice(startIndex).map((point, visibleIndex) => {
              const sourceIndex = visibleIndex + startIndex;
              const previous = sourceIndex > 0 ? chartPoints[sourceIndex - 1] : null;
              const netNewMembers = previous
                ? point.totalUsers - previous.totalUsers
                : (active.previousDayDeltaUsers ?? 0);

              return {
                date: point.date,
                NewMembers: netNewMembers,
              };
            });
          })()
        : [];

  const showCharts = growthData.length > 0;
  const chartHeading = period === "all" ? "Member growth" : "New Members";
  const chartLine =
    period === "all"
      ? { key: "Members", name: "Members", color: "var(--accent)" }
      : { key: "NewMembers", name: "Total Members", color: "var(--accent)" };

  return (
    <div className="mt-[clamp(2rem,4vw,3.2rem)] space-y-[clamp(2.5rem,5vw,4.5rem)] [--accent:var(--suite-accent-light)] dark:[--accent:var(--suite-accent-dark)]">
      <section data-testid="community-hero-panel">
        <article className="rounded-3xl border border-border/70 bg-card/70 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            Subway Builder Modded Community
          </p>
          <h2 className="mt-2 text-[clamp(1.8rem,3.3vw,2.7rem)] font-semibold tracking-tight text-foreground">
            Join the Discord Server
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Connect with maintainers and builders, follow releases, and see how the community is
            evolving with visualized analytics.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <SuiteAccentButton tone="solid" asChild>
              <a
                href={COMMUNITY_DISCORD_LINK}
                target="_blank"
                rel="noopener noreferrer"
               
              >
                <DiscordIcon className="mr-1.5 size-4" aria-hidden="true" />
                Join Discord
              </a>
            </SuiteAccentButton>
          </div>
        </article>
      </section>

      <section>
        <SectionSeparator
          label="Server Analytics"
          icon={BarChart3}
          headingLevel={2}
          className="mb-4"
        />

        <div
          role="tablist"
         
          className="inline-flex rounded-xl border border-border/70 bg-card/70 p-1"
        >
          {ALL_PERIODS.map((option) => {
            const selected = option === period;
            return (
              <button
                key={option}
                id={`community-period-${option}`}
                role="tab"
                aria-selected={selected}
                aria-controls="community-period-panel"
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-semibold transition",
                  selected
                    ? "border-[color:var(--accent)]/45 bg-card text-foreground shadow-sm"
                    : "border-transparent text-muted-foreground hover:border-border/70 hover:text-foreground",
                )}
                onClick={() => setPeriod(option)}
              >
                {periodLabel(option)}
              </button>
            );
          })}
        </div>

        <div
          id="community-period-panel"
          role="tabpanel"
          aria-labelledby={`community-period-${period}`}
        >
          {period !== "all" && active ? (
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricDirectoryCard
                title="Total member count"
                value={formatNumber(active.summary.membersNow)}
                icon="Users"
              />
              <MetricDirectoryCard
                title="Server Growth"
                value={formatDelta(active.summary.netGrowth)}
                icon="Gauge"
                valueClassName={
                  active.summary.netGrowth > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : active.summary.netGrowth < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : undefined
                }
              />
              <MetricDirectoryCard
                title="Members joined"
                value={formatNumber(active.summary.joined)}
                icon="UserPlus"
              />
              <MetricDirectoryCard
                title="Members left"
                value={formatNumber(active.summary.left)}
                icon="UserMinus"
              />
            </div>
          ) : period === "all" && model.allTime ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricDirectoryCard
                title="Current members"
                value={formatNumber(model.allTime.currentMembers)}
                icon="Users"
              />
              <MetricDirectoryCard
                title="Members joined"
                value={formatNumber(model.allTime.totalJoined)}
                icon="TrendingUp"
              />
              <MetricDirectoryCard
                title="Members left"
                value={formatNumber(model.allTime.totalLeft)}
                icon="TrendingDown"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          {showCharts ? (
            <article className="rounded-2xl border border-border/70 bg-card/70 p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {chartHeading}
              </h3>
              <AnalyticsLineChart
                data={growthData}
                lines={[chartLine]}
                xAxisKey="date"
                height={220}
                startAtZero={true}
              />
            </article>
          ) : null}
        </div>
      </section>

      <section>
        <SectionSeparator label="Community" icon={Users} headingLevel={2} className="mb-4" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {COMMUNITY_VALUES.map((item) => (
            <DirectoryCard
              key={item.title}
              alignment="top"
              interactive={false}
              showChevron={false}
              icon={renderIcon(item.icon)}
              heading={item.title}
              description={item.description}
              className="rounded-2xl border border-border/70 bg-card/65 p-2"
            ></DirectoryCard>
          ))}
        </div>
      </section>
    </div>
  );
}
