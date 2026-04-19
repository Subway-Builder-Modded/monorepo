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
        className="xl:mx-auto xl:max-w-[1180px] xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] xl:gap-12"
        left={
          <div className="mx-auto w-full max-w-3xl lg:mx-0 lg:max-w-none">
            <CodeSurface />
          </div>
        }
        right={
          <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center lg:mx-0 lg:ml-auto lg:max-w-md lg:items-end lg:text-right">
            <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground lg:ml-auto">
              {OPEN_SOURCE_SECTION.body}
            </p>
            <div className="mt-6 lg:mt-7">
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
