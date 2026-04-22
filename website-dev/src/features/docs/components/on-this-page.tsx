import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowUpToLine, Copy, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { mdxToMarkdown } from "@/features/docs/lib/markdown-copy";
import type { DocsTocHeading } from "@/features/docs/lib/types";

function useActiveHeading(headings: DocsTocHeading[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) {
      setActiveId(null);
      return;
    }

    let frameId = 0;
    const marker = 120;
    let headingOffsets: { id: string; top: number }[] = [];

    const updateFromScroll = () => {
      if (headingOffsets.length === 0) {
        setActiveId((prev) => {
          const fallback = headings[0]?.id ?? null;
          return prev === fallback ? prev : fallback;
        });
        return;
      }

      const markerY = window.scrollY + marker;
      let nextActive = headingOffsets[0]!.id;
      for (const entry of headingOffsets) {
        if (entry.top <= markerY) {
          nextActive = entry.id;
        } else {
          break;
        }
      }

      setActiveId((prev) => (prev === nextActive ? prev : nextActive));
    };

    const measureOffsets = () => {
      headingOffsets = headings
        .map((heading) => {
          const element = document.getElementById(heading.id);
          if (!element) return null;
          return { id: heading.id, top: element.getBoundingClientRect().top + window.scrollY };
        })
        .filter((item): item is { id: string; top: number } => item !== null);
      updateFromScroll();
    };

    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateFromScroll();
      });
    };

    measureOffsets();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measureOffsets);
    window.addEventListener("hashchange", measureOffsets);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureOffsets);
      window.removeEventListener("hashchange", measureOffsets);
    };
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
  const candidateHeadings = useMemo(
    () => headings.filter((heading) => heading.level >= 2 && heading.level <= 4),
    [headings],
  );

  // Track which heading IDs are actually rendered in the DOM. Headings that
  // live inside an inactive tab panel are not in the DOM and must not appear
  // in the "On This Page" rail until that tab becomes active.
  const [renderedIds, setRenderedIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (candidateHeadings.length === 0) {
      setRenderedIds(new Set());
      return;
    }

    let frameId = 0;
    const recompute = () => {
      const next = new Set<string>();
      for (const heading of candidateHeadings) {
        if (document.getElementById(heading.id)) {
          next.add(heading.id);
        }
      }
      setRenderedIds((prev) => {
        if (prev && prev.size === next.size && [...next].every((id) => prev.has(id))) {
          return prev;
        }
        return next;
      });
    };

    const scheduleRecompute = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        recompute();
      });
    };

    recompute();
    scheduleRecompute();

    window.addEventListener("sbm-tab-group-change", scheduleRecompute);
    window.addEventListener("sbm-docs-content-change", scheduleRecompute);

    const observer = new MutationObserver(scheduleRecompute);
    const article = document.querySelector("article");
    if (article) {
      observer.observe(article, { childList: true, subtree: true });
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("sbm-tab-group-change", scheduleRecompute);
      window.removeEventListener("sbm-docs-content-change", scheduleRecompute);
      observer.disconnect();
    };
  }, [candidateHeadings]);

  const filteredHeadings = useMemo(() => {
    if (!renderedIds) return candidateHeadings;
    return candidateHeadings.filter((heading) => renderedIds.has(heading.id));
  }, [candidateHeadings, renderedIds]);

  const observedActiveId = useActiveHeading(filteredHeadings);
  const [manualActiveId, setManualActiveId] = useState<string | null>(null);
  const activeId = manualActiveId ?? observedActiveId;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setManualActiveId(null);
  }, [observedActiveId]);

  const scrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const targetTop = element.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      window.history.replaceState(null, "", `#${id}`);
      setManualActiveId(id);
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

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden pb-8 scrollbar-thin">
        <div className="p-2">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            On This Page
          </h3>

          {filteredHeadings.length > 0 ? (
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
          ) : (
            <p className="px-2 py-1.5 text-[12px] text-muted-foreground">
              No sections on this page.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:hover:text-[var(--suite-accent-dark)]"
            >
              <ArrowUpToLine className="size-3" aria-hidden="true" />
              Top
            </button>

            {editUrl ? (
              <a
                href={editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:hover:text-[var(--suite-accent-dark)]"
              >
                <Pencil className="size-3" aria-hidden="true" />
                Edit
              </a>
            ) : null}

            {rawContent ? (
              <button
                type="button"
                onClick={copyMarkdown}
                className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:hover:text-[var(--suite-accent-dark)]"
              >
                <Copy className="size-3" aria-hidden="true" />
                {copied ? "Copied" : "Copy"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
