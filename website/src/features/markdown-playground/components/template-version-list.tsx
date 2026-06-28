import { Eye } from "lucide-react";
import { SectionSeparator, SuiteAccentButton } from "@subway-builder-modded/shared-ui";
import type { RegistryTemplateVersion } from "@/lib/registry/template-types";

type TemplateVersionListProps = {
  versions: RegistryTemplateVersion[];
  onPreviewVersion: (version: RegistryTemplateVersion) => void;
};

export function TemplateVersionList({ versions, onPreviewVersion }: TemplateVersionListProps) {
  return (
    <section>
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

            {/* Right: Preview button */}
            <SuiteAccentButton
              tone="outline"
              onClick={() => onPreviewVersion(version)}
              data-testid={`template-version-preview-${version.version}`}
            >
              <Eye className="size-4" aria-hidden />
              Preview
            </SuiteAccentButton>
          </div>
        ))}
      </div>
    </section>
  );
}
