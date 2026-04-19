import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { SectionShell, SectionHeader } from "@subway-builder-modded/shared-ui";
import { GithubIcon } from "@/app/features/home/components/icons";
import { useThemeMode } from "@/app/hooks/use-theme-mode";

const CODE_SOURCE = `export const SUITE_PROJECTS = [
  {
    id: "railyard",
    title: "Railyard",
    description: "All-in-one content manager",
    openSource: true,
  },
  {
    id: "registry",
    title: "Registry",
    description: "GitHub-hosted content registry",
    openSource: true,
  },
  {
    id: "template-mod",
    title: "Template Mod",
    description: "TypeScript mod scaffold",
    openSource: true,
  },
  {
    id: "website",
    title: "Website",
    description: "Central hub and docs",
    openSource: true,
  },
] as const;`;

function useShikiHighlight(code: string, theme: string) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function highlight() {
      const { codeToHtml } = await import("shiki");
      const result = await codeToHtml(code, {
        lang: "typescript",
        theme: theme === "dark" ? "github-dark-default" : "github-light-default",
      });
      if (!cancelled) setHtml(result);
    }
    highlight();
    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  return html;
}

function CodeSurface() {
  const { resolvedTheme } = useThemeMode();
  const highlighted = useShikiHighlight(CODE_SOURCE, resolvedTheme);
  const lineCount = CODE_SOURCE.split("\n").length;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-[#0d0d0d] shadow-2xl dark:bg-[#0a0a0a]">
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[11px] font-medium text-white/30">homepage-content.ts</span>
      </div>
      <div className="flex overflow-x-auto">
        <div
          className="flex flex-col items-end border-r border-white/[0.04] px-3 py-4 font-mono text-[13px] leading-6 text-white/20 select-none"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i} className="block h-6 tabular-nums">
              {i + 1}
            </span>
          ))}
        </div>
        {highlighted ? (
          <div
            className="min-w-0 flex-1 overflow-x-auto p-4 font-mono text-[13px] leading-6 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : (
          <div className="flex-1 p-4">
            <pre className="font-mono text-[13px] leading-6 text-white/40">{CODE_SOURCE}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export function OpenSourceSection() {
  return (
    <SectionShell surfaced>
      <SectionHeader
        title="Open source, open process"
        description="Every project is public, every decision transparent. Explore the code or contribute directly."
      />

      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <CodeSurface />
        </div>

        <div className="order-1 lg:order-2">
          <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            All codebases are open with clear contributor workflows — docs, changelogs, and roadmaps
            maintained by the community. No gatekeeping, no exceptions.
          </p>
          <div className="mt-6">
            <a
              href="https://github.com/Subway-Builder-Modded"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-transparent px-6 py-3 text-[15px] font-bold tracking-[-0.01em] transition-colors",
                "bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              <GithubIcon className="size-4" />
              View on GitHub
              <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
