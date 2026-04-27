import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SectionShell,
  SectionHeader,
  TwoColumnSection,
  CodeDisplay,
} from "@subway-builder-modded/shared-ui";
import { GithubIcon } from "@subway-builder-modded/icons";
import { OPEN_SOURCE_SECTION } from "@/config/home";
import { useThemeMode } from "@/hooks/use-theme-mode";

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
        className="lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] min-[1920px]:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
        left={
          <div className="w-full max-w-3xl min-w-0">
            <CodeSurface />
          </div>
        }
        right={
          <div className="w-full max-w-md min-w-0 text-center lg:text-right">
            <p className="text-[15px] leading-relaxed text-muted-foreground lg:text-[16px] min-[1920px]:text-[17px]">
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
                <GithubIcon className="size-6" />
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
