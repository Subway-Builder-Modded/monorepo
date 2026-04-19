import { Link } from "@/app/lib/router";
import {
  SectionShell,
  SectionHeader,
  TwoColumnSection,
  TerminalFrame,
} from "@subway-builder-modded/shared-ui";
import { ANALYTICS_LINKS, ANALYTICS_SECTION } from "@/app/features/home/data/homepage-content";
import { useThemeMode } from "@/app/hooks/use-theme-mode";

const MAP_COLOR = "#1c7ed6";
const MOD_COLOR = "#e03131";

function AnalyticsGraphic() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
  const axisColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)";
  const textColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)";

  return (
    <TerminalFrame title="analytics — downloads">
      <div className="p-5 sm:p-6">
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
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
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

          {["0", "2k", "4k", "6k", "8k"].reverse().map((label, i) => (
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

          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((label, i) => (
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

          <polyline
            points="40,150 112,135 184,115 256,100 328,82 400,65 470,48"
            fill="none"
            stroke={MAP_COLOR}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="40,165 112,155 184,140 256,132 328,120 400,110 470,100"
            fill="none"
            stroke={MOD_COLOR}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {[
            { label: "Maps", color: MAP_COLOR },
            { label: "Mods", color: MOD_COLOR },
          ].map((item, ci) => (
            <g key={ci}>
              <rect
                x={70 + ci * 100}
                y={4}
                width={8}
                height={8}
                rx={2}
                fill={item.color}
                opacity={0.8}
              />
              <text x={82 + ci * 100} y={12} fill={textColor} fontSize={9} fontFamily="monospace">
                {item.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </TerminalFrame>
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
        left={
          <div className="flex flex-col items-center text-center">
            <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              {ANALYTICS_SECTION.body}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:max-w-xs">
              {ANALYTICS_LINKS.map((link) => {
                const Icon = link.icon;
                const color = isDark ? link.accent.dark : link.accent.light;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
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
        right={<AnalyticsGraphic />}
      />
    </SectionShell>
  );
}
