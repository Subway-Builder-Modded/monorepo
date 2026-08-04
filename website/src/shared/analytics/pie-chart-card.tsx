import type { ComponentType } from "react";
import { AnalyticsPieChart, type PieSlice } from "@subway-builder-modded/analytics";
import { ChartCard } from "@/shared/styles/panels";

/**
 * The standard share pie: ChartCard + AnalyticsPieChart at the height that
 * lines up beside a MultiSeriesChartCard. Place it next to the chart whose
 * numbers it decomposes, titled by measure ("Download Share by Version").
 */
export function PieChartCard({
  title,
  icon,
  data,
}: {
  title: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  data: PieSlice[];
}) {
  return (
    <ChartCard title={title} icon={icon} className="min-h-[22rem]">
      <AnalyticsPieChart data={data} height={250} />
    </ChartCard>
  );
}
