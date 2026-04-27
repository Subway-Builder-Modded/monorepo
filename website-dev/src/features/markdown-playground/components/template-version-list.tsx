import { Sparkles } from "lucide-react";
import { SectionSeparator, SuiteAccentButton } from "@subway-builder-modded/shared-ui";
import type { RegistryTemplateVersion } from "@/lib/registry/template-types";

type TemplateVersionListProps = {
  versions: RegistryTemplateVersion[];
  onUseVersion: (version: RegistryTemplateVersion) => void;
};

export function TemplateVersionList({ versions, onUseVersion }: TemplateVersionListProps) {
  return (
    <section aria-label="Available versions">
      <SectionSeparator label="Versions" className="mb-3" headingLevel={3} />
      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70">
        {versions.map((version) => (
          <div
            key={version.id}
            className="flex items-center justify-between gap-4 bg-card/60 px-5 py-4"
            data-testid={`template-version-row-${version.version}`}
          >
            {/* Left: version + date */}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-foreground">
                {version.version}
              </span>
              <span className="text-xs text-muted-foreground">({version.datePublished})</span>
            </div>

            {/* Right: Use button */}
            <SuiteAccentButton
              tone="outline"
              className="shrink-0 gap-1.5"
              onClick={() => onUseVersion(version)}
              data-testid={`template-version-use-${version.version}`}
            >
              <Sparkles className="size-3.5" aria-hidden />
              Use
            </SuiteAccentButton>
          </div>
        ))}
      </div>
    </section>
  );
}
