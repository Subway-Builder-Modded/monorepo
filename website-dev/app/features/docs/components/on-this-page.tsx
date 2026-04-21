import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowUpToLine, Copy, Pencil } from "lucide-react";
import { SuiteAccentButton, SuiteAccentInlineAction } from "@subway-builder-modded/shared-ui";
import { cn } from "@/app/lib/utils";
import { mdxToMarkdown } from "@/app/features/docs/lib/markdown-copy";
import type { DocsTocHeading } from "@/app/features/docs/lib/types";

function useActiveHeading(headings: DocsTocHeading[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-92px 0px -62% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

export function OnThisPage({
  headings,
  editUrl,
  rawContent,
}: {
  headings: DocsTocHeading[];
  editUrl?: string;
  rawContent?: string | null;
}) {
  const filteredHeadings = useMemo(
    () => headings.filter((heading) => heading.level >= 2 && heading.level <= 4),
    [headings],
  );
  const activeId = useActiveHeading(filteredHeadings);
  const [copied, setCopied] = useState(false);

  const scrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const copyMarkdown = useCallback(async () => {
    if (!rawContent) return;
    try {
      const markdown = mdxToMarkdown(rawContent);
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }, [rawContent]);

  if (filteredHeadings.length === 0) return null;

  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden pb-8 scrollbar-thin">
        <div className="p-2">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            On This Page
          </h3>

          <ul className="relative space-y-1 pl-1">
            {filteredHeadings.map((heading) => {
              const isActive = activeId === heading.id;
              return (
                <li key={heading.id} className="relative">
                  <button
                    type="button"
                    onClick={() => scrollTo(heading.id)}
                    className={cn(
                      "w-full rounded-md py-1 text-left text-[12px] leading-snug transition-colors",
                      heading.level === 2 && "pl-2",
                      heading.level === 3 && "pl-4",
                      heading.level === 4 && "pl-6",
                      isActive
                        ? "bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] font-semibold text-[var(--suite-accent-light)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_17%,transparent)] dark:text-[var(--suite-accent-dark)]"
                        : "text-muted-foreground hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_8%,transparent)] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_12%,transparent)] dark:hover:text-[var(--suite-accent-dark)]",
                    )}
                  >
                    {heading.text}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <SuiteAccentInlineAction onClick={scrollToTop} className="h-7 px-2 text-[11px]">
              <ArrowUpToLine className="size-3" aria-hidden="true" />
              Top
            </SuiteAccentInlineAction>

            {editUrl ? (
              <SuiteAccentButton asChild tone="outline" className="h-7 gap-1.5 rounded-md px-2 text-[11px]">
                <a href={editUrl} target="_blank" rel="noopener noreferrer">
                  <Pencil className="size-3" aria-hidden="true" />
                  Edit
                </a>
              </SuiteAccentButton>
            ) : null}

            {rawContent ? (
              <SuiteAccentInlineAction onClick={copyMarkdown} className="h-7 px-2 text-[11px]">
                <Copy className="size-3" aria-hidden="true" />
                {copied ? "Copied" : "Copy"}
              </SuiteAccentInlineAction>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
