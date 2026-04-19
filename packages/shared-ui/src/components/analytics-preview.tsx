import { TerminalFrame } from './terminal-frame';

export type AnalyticsPreviewSeries = {
  label: string;
  color: string;
  points: string;
};

export type AnalyticsPreviewProps = {
  title?: string;
  xLabels: readonly string[];
  yLabels: readonly string[];
  series: readonly AnalyticsPreviewSeries[];
  resolvedTheme?: string;
};

export function AnalyticsPreview({
  title,
  xLabels,
  yLabels,
  series,
  resolvedTheme = 'dark',
}: AnalyticsPreviewProps) {
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(15,23,42,0.11)';
  const axisColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.24)';
  const textColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.55)';

  return (
    <TerminalFrame title={title} bodyClassName="p-5 sm:p-6">
      <svg viewBox="0 0 480 200" className="w-full" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`h${i}`}
            x1={40}
            y1={20 + i * 40}
            x2={470}
            y2={20 + i * 40}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        {xLabels.map((_, i) => (
          <line
            key={`v${i}`}
            x1={40 + i * 72}
            y1={20}
            x2={40 + i * 72}
            y2={180}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}

        <line x1={40} y1={20} x2={40} y2={180} stroke={axisColor} strokeWidth={1} />
        <line x1={40} y1={180} x2={470} y2={180} stroke={axisColor} strokeWidth={1} />

        {yLabels.map((label, i) => (
          <text
            key={label}
            x={34}
            y={24 + i * 40}
            textAnchor="end"
            fill={textColor}
            fontSize={10}
            fontFamily="monospace"
          >
            {label}
          </text>
        ))}

        {xLabels.map((label, i) => (
          <text
            key={label}
            x={40 + i * 72}
            y={194}
            textAnchor="middle"
            fill={textColor}
            fontSize={10}
            fontFamily="monospace"
          >
            {label}
          </text>
        ))}

        {series.map((item) => (
          <polyline
            key={item.label}
            points={item.points}
            fill="none"
            stroke={item.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {series.map((item, index) => (
          <g key={`legend-${item.label}`}>
            <rect x={70 + index * 100} y={4} width={8} height={8} rx={2} fill={item.color} opacity={0.92} />
            <text
              x={82 + index * 100}
              y={12}
              fill={textColor}
              fontSize={9}
              fontFamily="monospace"
            >
              {item.label}
            </text>
          </g>
        ))}
      </svg>
    </TerminalFrame>
  );
}
