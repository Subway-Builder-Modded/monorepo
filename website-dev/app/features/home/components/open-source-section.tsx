import { ExternalLink } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  SectionShell,
  SectionHeader,
  TwoColumnSection,
  CodeDisplay,
  GithubIcon,
} from "@subway-builder-modded/shared-ui";
import { OPEN_SOURCE_SECTION } from "@/app/features/home/data/homepage-content";
import { useThemeMode } from "@/app/hooks/use-theme-mode";

function CodeSurface() {
  const { resolvedTheme } = useThemeMode();

  return (
    <CodeDisplay
      code={OPEN_SOURCE_SECTION.codeSample.content}
      lang={OPEN_SOURCE_SECTION.codeSample.lang}
      title={OPEN_SOURCE_SECTION.codeSample.title}
      resolvedTheme={resolvedTheme}
    />
  );
}

export function OpenSourceSection() {
  return (
    <SectionShell surfaced>
      <SectionHeader
        title={OPEN_SOURCE_SECTION.title}
        description={OPEN_SOURCE_SECTION.description}
      />

      <TwoColumnSection
        reverseOnDesktop
        left={<CodeSurface />}
        right={
          <div className="flex flex-col items-center text-center">
            <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              {OPEN_SOURCE_SECTION.body}
            </p>
            <div className="mt-6">
              <a
                href={OPEN_SOURCE_SECTION.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border border-transparent px-6 py-3 text-[15px] font-bold tracking-[-0.01em] transition-colors",
                  "bg-foreground text-background hover:bg-foreground/90",
                )}
              >
                <GithubIcon className="size-4" />
                {OPEN_SOURCE_SECTION.cta.label}
                <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
              </a>
            </div>
          </div>
        }
      />
    </SectionShell>
  );
}
