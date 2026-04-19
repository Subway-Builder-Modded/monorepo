import { ChartLine } from "lucide-react";
import { Link } from "@/app/lib/router";
import { SectionShell, SectionHeader } from "@subway-builder-modded/shared-ui";
import { ANALYTICS_LINKS } from "@/app/features/home/data/homepage-content";
import { useThemeMode } from "@/app/hooks/use-theme-mode";

function AnalyticsGraphic() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === "dark";

  const suiteColors = [
    isDark ? "#19d89c" : "#0f8f68",
    isDark ? "#c77dff" : "#9d4edd",
    isDark ? "#93c5fd" : "#60a5fa",
    isDark ? "#ffbe73" : "#f2992e",
  ];

  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
  const axisColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const textColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-[#0d0d0d] shadow-2xl dark:bg-[#0a0a0a]">
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[11px] font-medium text-white/30">analytics — downloads</span>
      </div>
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
            points="40,140 112,120 184,100 256,85 328,70 400,55 470,42"
            fill="none"
            stroke={suiteColors[0]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="40,160 112,148 184,130 256,125 328,115 400,108 470,100"
            fill="none"
            stroke={suiteColors[1]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="40,170 112,162 184,155 256,148 328,142 400,135 470,130"
            fill="none"
            stroke={suiteColors[2]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
          />
          <polyline
            points="40,175 112,170 184,165 256,158 328,150 400,145 470,138"
            fill="none"
            stroke={suiteColors[3]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
          />

          {suiteColors.map((color, ci) => {
            const labels = ["Railyard", "Registry", "Template Mod", "Website"];
            return (
              <g key={ci}>
                <rect
                  x={70 + ci * 100}
                  y={4}
                  width={8}
                  height={8}
                  rx={2}
                  fill={color}
                  opacity={0.8}
                />
                <text x={82 + ci * 100} y={12} fill={textColor} fontSize={9} fontFamily="monospace">
                  {labels[ci]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function AnalyticsSection() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === "dark";

  return (
    <SectionShell>
      <SectionHeader
        title="Ecosystem at a glance"
        description="Real-time download counts, install trends, and usage data across every project."
      />

      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <AnalyticsGraphic />

        <div>
          <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Every project exposes analytics — download volumes, install trends, and growth metrics —
            so contributors and users can track ecosystem health at a glance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
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
                  <ChartLine className="ml-0.5 size-3 opacity-40" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
