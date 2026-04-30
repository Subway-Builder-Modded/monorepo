import { CodeDisplay } from "@subway-builder-modded/shared-ui";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { TEMPLATE_MOD_CODE } from "@/config/home/suite-content";

export function TemplateModHeroWorkbench() {
  const { resolvedTheme } = useThemeMode();

  return (
    <div
      className="relative isolate ml-auto w-full max-w-none"
      aria-label="Template Mod starter workbench"
    >
      <div
        className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-[radial-gradient(circle_at_15%_20%,color-mix(in_srgb,var(--suite-accent-light)_26%,transparent),transparent_52%),radial-gradient(circle_at_82%_78%,color-mix(in_srgb,var(--suite-accent-dark)_22%,transparent),transparent_54%)] blur-2xl"
        aria-hidden={true}
      />

      <div className="relative rounded-3xl border border-border/60 bg-card/75 p-4 shadow-[0_26px_60px_rgba(var(--elevation-shadow-rgb),0.35)] backdrop-blur-xl sm:p-5">
        <CodeDisplay
          code={TEMPLATE_MOD_CODE}
          lang="tsx"
          title="ridership-chart.tsx"
          resolvedTheme={resolvedTheme}
          className="w-full min-w-0"
        />
      </div>
    </div>
  );
}
