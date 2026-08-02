import type { ComponentType, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Central panel/card styling, so page files stop repeating the same class
 * strings. Prefer these over re-typing the literals:
 *
 * - ChartCard / CHART_CARD_CLASS: the elevated rounded-2xl card that wraps
 *   charts and data tables.
 * - PANEL_TITLE_CLASS: the small uppercase panel heading.
 * - SECTION_CARD_CLASS + SECTION_CARD_STYLE: the softer rounded-xl section
 *   wrapper with the translucent card background.
 * - accentChipStyle / accentChipBadgeStyle: the color-mix trio used by
 *   accent-colored pills and their count badges.
 */

export const CHART_CARD_CLASS = "rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5";

/** The unpadded chart-card shell, for tables/lists that manage their own edges. */
export const CHART_CARD_FLUSH_CLASS =
  "overflow-hidden rounded-2xl border border-border/70 bg-card/75";

export const PANEL_TITLE_CLASS =
  "text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export const SECTION_CARD_CLASS = "rounded-xl border border-border/70 p-4 sm:p-5";

export const SECTION_CARD_STYLE: CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
};

/** Pill styling for an accent-colored chip (text, border, wash background). */
export function accentChipStyle(accentLight: string, accentDark = accentLight): CSSProperties {
  return {
    color: `light-dark(${accentLight}, ${accentDark})`,
    borderColor: `color-mix(in srgb, ${accentLight} 34%, transparent)`,
    background: `color-mix(in srgb, ${accentLight} 10%, transparent)`,
  };
}

/** The slightly stronger wash used by the count badge nested inside a chip. */
export function accentChipBadgeStyle(accentLight: string): CSSProperties {
  return {
    borderColor: `color-mix(in srgb, ${accentLight} 38%, transparent)`,
    background: `color-mix(in srgb, ${accentLight} 14%, transparent)`,
  };
}

/**
 * The standard chart/table card, with an optional header row: icon + small
 * uppercase title on the left, arbitrary actions (mode switches, etc.) on the
 * right. The header row is h-9 so titles align across side-by-side cards
 * whether or not a card carries actions.
 */
export function ChartCard({
  title,
  icon: Icon,
  actions,
  className,
  children,
}: {
  title?: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const hasHeader = Boolean(title || Icon || actions);

  return (
    <article className={cn(CHART_CARD_CLASS, hasHeader && "space-y-3", className)}>
      {hasHeader ? (
        <div className="flex h-9 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden={true} /> : null}
            {title ? <h3 className={PANEL_TITLE_CLASS}>{title}</h3> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </article>
  );
}
