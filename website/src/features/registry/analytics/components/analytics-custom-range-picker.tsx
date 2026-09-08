import { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";
import {
  getTodayUtcDate,
  validateCustomRange,
  type RegistryAnalyticsCustomRange,
} from "@/features/registry/analytics/lib/load-registry-analytics";

const DATE_INPUT_CLASS =
  "h-10 rounded-lg border border-border/60 bg-card/70 px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--registry-type-accent)_44%,transparent)]";

/**
 * The Custom period's date inputs: a closed [from, to] interval of UTC days.
 * Edits apply immediately when the pair is valid; invalid pairs stay local
 * and surface the rule that failed (sub-week ranges need the hourly series'
 * floor; week-plus ranges end no later than yesterday).
 */
export function AnalyticsCustomRangePicker({
  range,
  onApply,
}: {
  /** The applied range from the URL (may be invalid on a hand-typed URL). */
  range: RegistryAnalyticsCustomRange;
  onApply: (range: RegistryAnalyticsCustomRange) => void;
}) {
  const [draft, setDraft] = useState(range);

  // A navigation (back button, preset switch and return) resets the draft to
  // the applied range.
  useEffect(() => {
    setDraft(range);
  }, [range]);

  const error = validateCustomRange(draft);
  const today = getTodayUtcDate();

  const handleChange = (next: RegistryAnalyticsCustomRange) => {
    setDraft(next);
    if (validateCustomRange(next) === null) {
      onApply(next);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <CalendarRange className="size-4 text-muted-foreground" aria-hidden={true} />
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          From
          <input
            type="date"
            value={draft.from}
            max={today}
            onChange={(event) => handleChange({ ...draft, from: event.target.value })}
            className={DATE_INPUT_CLASS}
            aria-label="Range start date (UTC)"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          To
          <input
            type="date"
            value={draft.to}
            max={today}
            onChange={(event) => handleChange({ ...draft, to: event.target.value })}
            className={DATE_INPUT_CLASS}
            aria-label="Range end date (UTC)"
          />
        </label>
        <span className="text-xs text-muted-foreground">UTC days, both inclusive</span>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
