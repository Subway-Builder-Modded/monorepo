import { useState, useEffect, useCallback } from "react";
import { cn } from "@/app/lib/utils";
import type { DocsTocHeading } from "@/app/features/docs/lib/types";

function useActiveHeading(headings: DocsTocHeading[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 },
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

export function OnThisPage({ headings }: { headings: DocsTocHeading[] }) {
  const activeId = useActiveHeading(headings);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden xl:block w-52 shrink-0">
      <nav
        className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8 scrollbar-thin"
        aria-label="On this page"
      >
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          On this page
        </h3>
        <ul className="relative border-l border-border/30 space-y-0.5">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <li key={heading.id} className="relative">
                {isActive && (
                  <span className="absolute left-0 top-1 h-4 w-px -translate-x-px bg-[var(--suite-accent-light)] dark:bg-[var(--suite-accent-dark)] transition-all" />
                )}
                <button
                  type="button"
                  onClick={() => scrollTo(heading.id)}
                  className={cn(
                    "block w-full text-left text-[12px] leading-snug py-1 pl-3 transition-colors",
                    heading.level === 3 && "pl-6",
                    heading.level === 4 && "pl-9",
                    isActive
                      ? "text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {heading.text}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
