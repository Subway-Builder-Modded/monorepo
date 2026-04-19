import { ExternalLink } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { SectionHeader } from "@subway-builder-modded/shared-ui";
import { GithubIcon } from "@/app/features/home/components/icons";

const HOMEPAGE_SHELL = "mx-auto w-full max-w-[1600px] px-5 sm:px-7 lg:px-10 xl:px-12";

const CODE_LINES = [
  {
    indent: 0,
    tokens: [
      { text: "export", color: "keyword" },
      { text: " ", color: "plain" },
      { text: "const", color: "keyword" },
      { text: " ", color: "plain" },
      { text: "SUITE_PROJECTS", color: "variable" },
      { text: " = [", color: "plain" },
    ],
  },
  { indent: 1, tokens: [{ text: "{", color: "plain" }] },
  {
    indent: 2,
    tokens: [
      { text: "id", color: "property" },
      { text: ": ", color: "plain" },
      { text: '"railyard"', color: "string" },
      { text: ",", color: "plain" },
    ],
  },
  {
    indent: 2,
    tokens: [
      { text: "title", color: "property" },
      { text: ": ", color: "plain" },
      { text: '"Railyard"', color: "string" },
      { text: ",", color: "plain" },
    ],
  },
  {
    indent: 2,
    tokens: [
      { text: "description", color: "property" },
      { text: ": ", color: "plain" },
      { text: '"All-in-one content manager"', color: "string" },
      { text: ",", color: "plain" },
    ],
  },
  {
    indent: 2,
    tokens: [
      { text: "openSource", color: "property" },
      { text: ": ", color: "plain" },
      { text: "true", color: "keyword" },
      { text: ",", color: "plain" },
    ],
  },
  { indent: 1, tokens: [{ text: "},", color: "plain" }] },
  { indent: 1, tokens: [{ text: "{", color: "plain" }] },
  {
    indent: 2,
    tokens: [
      { text: "id", color: "property" },
      { text: ": ", color: "plain" },
      { text: '"registry"', color: "string" },
      { text: ",", color: "plain" },
    ],
  },
  {
    indent: 2,
    tokens: [
      { text: "title", color: "property" },
      { text: ": ", color: "plain" },
      { text: '"Registry"', color: "string" },
      { text: ",", color: "plain" },
    ],
  },
  {
    indent: 2,
    tokens: [
      { text: "openSource", color: "property" },
      { text: ": ", color: "plain" },
      { text: "true", color: "keyword" },
      { text: ",", color: "plain" },
    ],
  },
  { indent: 1, tokens: [{ text: "},", color: "plain" }] },
  { indent: 0, tokens: [{ text: "];", color: "plain" }] },
] as const;

const TOKEN_COLORS: Record<string, string> = {
  keyword: "text-[#c77dff] dark:text-[#c77dff]",
  variable: "text-[#60a5fa] dark:text-[#93c5fd]",
  property: "text-[#19d89c] dark:text-[#19d89c]",
  string: "text-[#ffbe73] dark:text-[#ffbe73]",
  plain: "text-foreground/70",
};

function CodeSurface() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-[#0d0d0d] dark:bg-[#0a0a0a]">
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="ml-2 text-[11px] text-white/30">homepage-content.ts</span>
      </div>
      <div className="p-4 font-mono text-[13px] leading-6">
        {CODE_LINES.map((line, i) => (
          <div key={i} style={{ paddingLeft: `${line.indent * 20}px` }}>
            <span className="mr-4 inline-block w-5 text-right text-white/15 select-none">
              {i + 1}
            </span>
            {line.tokens.map((t, j) => (
              <span key={j} className={TOKEN_COLORS[t.color]}>
                {t.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpenSourceSection() {
  return (
    <section className={cn("py-14 lg:py-20", HOMEPAGE_SHELL)}>
      <SectionHeader
        kicker="Transparency"
        title="Open source, open process"
        description="Every project is public, every decision transparent. Explore the code or contribute directly."
      />

      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="order-2 lg:order-1">
          <CodeSurface />
        </div>

        <div className="order-1 lg:order-2">
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            All codebases are open with clear contributor workflows — docs, changelogs, and roadmaps
            maintained by the community. No gatekeeping, no exceptions.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <a
              href="https://github.com/Subway-Builder-Modded"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-transparent px-5 py-2.5 text-[15px] font-semibold transition-colors",
                "bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              <GithubIcon className="size-4" />
              GitHub
              <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
