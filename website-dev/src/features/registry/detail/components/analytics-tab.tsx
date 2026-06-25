import { ArrowDown, ArrowUp, ArrowUpDown, History, TrendingUp } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import {
  RankBadge,
  SectionSeparator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@subway-builder-modded/shared-ui";
import { AnalyticsLineChart } from "@subway-builder-modded/analytics";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";
import { getAnalyticsTabSections } from "@/features/registry/detail/config/analytics-tab-config";
import { DetailsMetricGrid } from "@/features/registry/detail/components/details-tab";

type AnalyticsTabProps = {
  detail: RegistryDetailModel;
};

type SortDirection = "asc" | "desc";
type TrendSortKey = "label" | "downloads";

function formatNumber(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "\u2014";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function compareNullableNumbers(
  left: number | null,
  right: number | null,
  direction: SortDirection,
) {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction === "asc" ? left - right : right - left;
}

function getNextDirection<T extends string>(
  currentKey: T,
  nextKey: T,
  directions: Record<T, SortDirection>,
) {
  return currentKey === nextKey
    ? directions[nextKey] === "asc"
      ? "desc"
      : "asc"
    : directions[nextKey];
}

function SortableTableHead({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const SortIcon = direction === "asc" ? ArrowUp : ArrowDown;
  const Icon = active ? SortIcon : ArrowUpDown;

  return (
    <TableHead className="px-4 text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-muted-foreground">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex w-full items-center justify-start gap-1.5 text-left text-xs font-semibold uppercase leading-4 tracking-[0.12em] transition-colors hover:text-[var(--registry-type-accent)] focus-visible:outline-none ${
          active ? "text-[var(--registry-type-accent)]" : ""
        }`}
        aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className="uppercase">{label}</span>
        <Icon className="size-3.5 shrink-0" aria-hidden={true} />
      </button>
    </TableHead>
  );
}

function StaticTableHead({ label }: { label: string }) {
  return (
    <TableHead className="px-4 text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-muted-foreground">
      <span className="inline-flex w-full items-center justify-start text-left text-xs font-semibold uppercase leading-4 tracking-[0.12em]">
        {label}
      </span>
    </TableHead>
  );
}

export function AnalyticsTab({ detail }: AnalyticsTabProps) {
  const sections = getAnalyticsTabSections(detail);
  const [trendSortKey, setTrendSortKey] = useState<TrendSortKey>("downloads");
  const [trendDirections, setTrendDirections] = useState<Record<TrendSortKey, SortDirection>>({
    label: "asc",
    downloads: "desc",
  });
  const trendDirection = trendDirections[trendSortKey];
  const sortedDownloadTrends = useMemo(() => {
    return [...detail.downloadTrends].sort((left, right) => {
      if (trendSortKey === "label") {
        return trendDirection === "asc"
          ? left.label.localeCompare(right.label)
          : right.label.localeCompare(left.label);
      }
      return compareNullableNumbers(left[trendSortKey], right[trendSortKey], trendDirection);
    });
  }, [detail.downloadTrends, trendDirection, trendSortKey]);
  const chartData = detail.downloadHistory.map((point) => ({
    date: point.date,
    Downloads: point.downloads,
  }));

  if (sections.length === 0 && chartData.length === 0 && detail.downloadTrends.length === 0) {
    return null;
  }

  const handleTrendSort = (nextKey: TrendSortKey) => {
    setTrendDirections((current) => ({
      ...current,
      [nextKey]: getNextDirection(trendSortKey, nextKey, current),
    }));
    setTrendSortKey(nextKey);
  };

  return (
    <section
      className="space-y-3 [--accent:var(--registry-type-accent)]"
      style={{ "--registry-type-accent": detail.typeConfig.accentLight } as CSSProperties}
    >
      {sections.map((section, index) => (
        <div key={`${section.title}-${index}`}>
          <SectionSeparator
            label={section.title}
            icon={section.icon}
            className={index === 0 ? "mb-4" : "mb-4 mt-7"}
          />
          <DetailsMetricGrid
            className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            items={section.cards}
            accentLight={detail.typeConfig.accentLight}
            accentDark={detail.typeConfig.accentDark}
          />
        </div>
      ))}

      {detail.downloadTrends.length > 0 ? (
        <div>
          <SectionSeparator label="Recent Trends" icon={TrendingUp} className="mb-4 mt-7" />
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/75">
            <Table>
              <TableHeader>
                <TableRow className="border-border/70 bg-muted/35 hover:bg-muted/35">
                  <SortableTableHead
                    label="Period"
                    active={trendSortKey === "label"}
                    direction={trendDirection}
                    onClick={() => handleTrendSort("label")}
                  />
                  <SortableTableHead
                    label="Downloads"
                    active={trendSortKey === "downloads"}
                    direction={trendDirection}
                    onClick={() => handleTrendSort("downloads")}
                  />
                  <StaticTableHead label="Rank" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDownloadTrends.map((trend) => (
                  <TableRow key={trend.period} className="border-border/60 hover:bg-transparent">
                    <TableCell className="px-4 font-medium text-foreground">
                      {trend.label}
                    </TableCell>
                    <TableCell className="px-4 font-semibold tabular-nums text-[var(--registry-type-accent)]">
                      {formatNumber(trend.downloads)}
                    </TableCell>
                    <TableCell className="px-4">
                      <RankBadge rank={trend.rank} className="size-7 text-xs" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {chartData.length > 0 ? (
        <div>
          <SectionSeparator label="Download History" icon={History} className="mb-4 mt-7" />
          <article className="rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
            <AnalyticsLineChart
              data={chartData}
              lines={[
                {
                  key: "Downloads",
                  name: "Downloads",
                  color: "var(--registry-type-accent)",
                },
              ]}
              xAxisKey="date"
              height={220}
              startAtZero={true}
            />
          </article>
        </div>
      ) : null}
    </section>
  );
}
