export type AnalyticsTooltipPayload = {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number;
};

export type AnalyticsTooltipProps = {
  active?: boolean;
  payload?: AnalyticsTooltipPayload[];
  label?: string | number;
};

function formatTooltipLabel(label: string | number | undefined): string {
  if (typeof label !== "string") return String(label ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(label)) return label;

  const d = new Date(`${label}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function AnalyticsTooltip({ active, payload, label }: AnalyticsTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[140px] rounded-xl border border-border/70 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {formatTooltipLabel(label)}
      </p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div
            key={`${String(entry.name)}-${i}`}
            className="flex items-center gap-2 text-sm"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: entry.color }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{String(entry.name ?? "")}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString("en-US")
                : String(entry.value ?? "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
