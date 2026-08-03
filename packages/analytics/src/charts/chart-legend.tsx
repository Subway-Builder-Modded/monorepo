import { CHART_FONT_SIZE } from './chart-theme';

export type ToggleableLegendEntry = {
  key: string;
  name: string;
  color: string;
};

/**
 * Shared clickable legend for multi-series charts: clicking an entry toggles
 * that series' visibility; hiding the last visible series restores all (the
 * caller implements that rule in `onToggle`). Hidden entries render muted
 * with a strikethrough.
 */
export function AnalyticsChartLegend({
  entries,
  hiddenKeys,
  onToggle,
  columnGap = '0.9rem',
}: {
  entries: ToggleableLegendEntry[];
  hiddenKeys: ReadonlySet<string>;
  onToggle: (key: string) => void;
  columnGap?: string;
}) {
  if (entries.length <= 1) return null;

  return (
    <ul
      style={{
        alignItems: 'center',
        color: 'hsl(var(--foreground))',
        columnGap,
        display: 'flex',
        flexWrap: 'wrap',
        fontSize: CHART_FONT_SIZE,
        justifyContent: 'center',
        listStyle: 'none',
        margin: '0.75rem 0 0',
        padding: 0,
        rowGap: '0.5rem',
      }}
    >
      {entries.map((entry) => {
        const isHidden = hiddenKeys.has(entry.key);
        return (
          <li key={entry.key} style={{ display: 'inline-flex' }}>
            <button
              type="button"
              onClick={() => onToggle(entry.key)}
              aria-pressed={!isHidden}
              title={isHidden ? `Show ${entry.name}` : `Hide ${entry.name}`}
              style={{
                alignItems: 'center',
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                display: 'inline-flex',
                font: 'inherit',
                gap: '0.4rem',
                lineHeight: 1,
                opacity: isHidden ? 0.45 : 1,
                padding: 0,
                textDecoration: isHidden ? 'line-through' : 'none',
              }}
            >
              <span
                style={{
                  backgroundColor: entry.color,
                  borderRadius: '9999px',
                  display: 'block',
                  flexShrink: 0,
                  height: '0.5rem',
                  width: '0.5rem',
                }}
                aria-hidden={true}
              />
              <span>{entry.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Toggle helper implementing the shared rule: toggling an already-hidden key
 * shows it again; hiding the final visible series restores all instead of
 * leaving an empty chart.
 */
export function toggleLegendKey(
  hiddenKeys: ReadonlySet<string>,
  key: string,
  totalCount: number,
): Set<string> {
  const next = new Set(hiddenKeys);
  if (next.has(key)) {
    next.delete(key);
    return next;
  }
  next.add(key);
  return next.size >= totalCount ? new Set() : next;
}
