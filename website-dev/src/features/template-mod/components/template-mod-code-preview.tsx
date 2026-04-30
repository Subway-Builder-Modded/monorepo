import { CodeDisplay, SectionHeader, SectionShell } from "@subway-builder-modded/shared-ui";
import { TEMPLATE_MOD_CODE_EXAMPLES } from "@/features/template-mod/template-mod-content";
import { resolveLucideIcon as resolveIcon } from "@/features/content/lib/icon-resolver";
import { useThemeMode } from "@/hooks/use-theme-mode";

export function TemplateModCodePreview() {
  const { resolvedTheme } = useThemeMode();
  const tabs = TEMPLATE_MOD_CODE_EXAMPLES.map((example) => {
    const IconComponent = resolveIcon(example.icon);
    return {
      id: example.id,
      label: example.label,
      icon: <IconComponent className="size-4" aria-hidden={true} />,
      code: example.content,
      lang: example.lang,
      title: example.title,
    };
  });

  return (
    <SectionShell surfaced>
      <SectionHeader
        title="Developer Workbench"
        description="Comes pre-packages with all of the essential tools and configurations to get you started creating mods."
      />

      <div className="mt-7 rounded-3xl border border-border/55 bg-card/75 p-3 sm:p-4">
        <CodeDisplay
          tabs={tabs}
          tabsAriaLabel="Template Mod code preview tabs"
          resolvedTheme={resolvedTheme}
        />
      </div>
    </SectionShell>
  );
}
