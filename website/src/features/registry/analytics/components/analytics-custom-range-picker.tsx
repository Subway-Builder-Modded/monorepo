import { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";
import {
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  type CalendarDateRange as DateRange,
} from "@subway-builder-modded/shared-ui";
import {
  HOURLY_RANGE_MAX_DAYS,
  HOURLY_SERIES_FLOOR_DATE,
  getCustomRangeDayCount,
  getTodayUtcDate,
  validateCustomRange,
  type RegistryAnalyticsCustomRange,
} from "@/features/registry/analytics/lib/load-registry-analytics";

// The calendar's Date objects are local-midnight; our domain is UTC day
// strings. Cells are treated as literal Y-M-D labels: convert by local
// COMPONENTS (never by timestamp), so a viewer west of UTC still picks the
// day printed in the cell. Constraints use the UTC "today" throughout.
function toCalendarDate(day: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  return new Date(
    Number.parseInt(day.slice(0, 4), 10),
    Number.parseInt(day.slice(5, 7), 10) - 1,
    Number.parseInt(day.slice(8, 10), 10),
  );
}

function toDayString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

const RANGE_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatRangeLabel(range: RegistryAnalyticsCustomRange): string {
  const from = Date.parse(`${range.from}T00:00:00Z`);
  const to = Date.parse(`${range.to}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return "Select dates";
  return `${RANGE_LABEL_FORMATTER.format(from)} – ${RANGE_LABEL_FORMATTER.format(to)}`;
}

/**
 * The Custom period's range picker: a two-month calendar popup selecting a
 * closed [from, to] interval of UTC days. While an end date is being picked,
 * days that would violate a rule are disabled in place: a start before the
 * hourly-series floor forces a week-plus range, and week-plus ranges must end
 * on a complete day (yesterday at the latest); only sub-week ranges may
 * include the current day. validateCustomRange stays the final gate, so a
 * hand-typed URL surfaces the same rules as text.
 */
export function AnalyticsCustomRangePicker({
  range,
  onApply,
}: {
  /** The applied range from the URL (may be invalid on a hand-typed URL). */
  range: RegistryAnalyticsCustomRange;
  onApply: (range: RegistryAnalyticsCustomRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);

  // Opening (or a navigation while open) re-seeds the draft from the applied
  // range; closing discards a half-picked selection.
  useEffect(() => {
    if (!open) setDraft(undefined);
  }, [open, range]);

  const appliedError = validateCustomRange(range);
  const today = getTodayUtcDate();
  const selected: DateRange | undefined =
    draft ??
    (appliedError === null
      ? { from: toCalendarDate(range.from), to: toCalendarDate(range.to) }
      : undefined);
  const pendingFrom = draft?.from && !draft.to ? toDayString(draft.from) : null;

  const isDayDisabled = (date: Date) => {
    const day = toDayString(date);
    if (day > today) return true;
    // Picking the end: days at or after the pending start must satisfy the
    // span rules (an earlier day re-anchors the range, so it stays enabled).
    if (pendingFrom && day >= pendingFrom) {
      const span = getCustomRangeDayCount({ from: pendingFrom, to: day });
      if (pendingFrom < HOURLY_SERIES_FLOOR_DATE && span < HOURLY_RANGE_MAX_DAYS) return true;
      if (span >= HOURLY_RANGE_MAX_DAYS && day >= today) return true;
    }
    return false;
  };

  const handleSelect = (next: DateRange | undefined, triggerDate: Date) => {
    // DayPicker extends a complete range on an outside click, which would
    // bypass the greyed-out end-date constraints; instead, a click with a
    // complete range in place always anchors a NEW range.
    if (!draft?.from || draft.to) {
      setDraft({ from: triggerDate, to: undefined });
      return;
    }
    setDraft(next);
    if (!next?.from || !next.to) return;
    const nextRange = { from: toDayString(next.from), to: toDayString(next.to) };
    if (validateCustomRange(nextRange) === null) {
      onApply(nextRange);
      setOpen(false);
    }
  };

  const hint = pendingFrom
    ? pendingFrom < HOURLY_SERIES_FLOOR_DATE
      ? "Pick an end date - ranges starting before the hourly series (2026-07-01) span at least a week and end on a complete day."
      : "Pick an end date - only ranges shorter than a week may include today."
    : "Pick a start date. Ranges shorter than a week chart 4-hour buckets.";

  return (
    <div className="flex flex-col items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-4 text-sm font-medium text-foreground transition-colors hover:border-[color-mix(in_srgb,var(--registry-type-accent)_45%,var(--border))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--registry-type-accent)_44%,transparent)]"
          aria-label="Change date range"
        >
          <CalendarRange className="size-4 text-muted-foreground" aria-hidden={true} />
          <span>{formatRangeLabel(range)}</span>
          <span className="text-xs text-muted-foreground">UTC</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="range"
            numberOfMonths={2}
            defaultMonth={toCalendarDate(range.from)}
            selected={selected}
            onSelect={handleSelect}
            disabled={isDayDisabled}
          />
          <p className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
            {hint}
          </p>
        </PopoverContent>
      </Popover>
      {appliedError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {appliedError}
        </p>
      ) : null}
    </div>
  );
}
