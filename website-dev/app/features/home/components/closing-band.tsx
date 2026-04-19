import { Compass, ExternalLink } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";
import { GithubIcon } from "@/app/features/home/components/icons";
import { HERO_SUITE_BARS } from "@/app/features/home/data/homepage-content";

const HOMEPAGE_SHELL = "mx-auto w-full max-w-[1600px] px-5 sm:px-7 lg:px-10 xl:px-12";

export function ClosingBand() {
  return (
    <section className={cn("relative py-16 lg:py-24", HOMEPAGE_SHELL)}>
      <div className="mb-8 flex items-center gap-1" aria-hidden="true">
        {HERO_SUITE_BARS.map((c, i) => (
          <span
            key={i}
            className="h-0.5 w-6 rounded-full dark:hidden"
            style={{ backgroundColor: c.light }}
          />
        ))}
        {HERO_SUITE_BARS.map((c, i) => (
          <span
            key={`d${i}`}
            className="hidden h-0.5 w-6 rounded-full dark:block"
            style={{ backgroundColor: c.dark }}
          />
        ))}
      </div>

      <h2 className="text-2xl font-extrabold tracking-[-0.025em] text-foreground sm:text-3xl">
        Choose your route
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
        Start with the content manager, explore the registry, or dive into the source.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <Link
          to="/railyard"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-transparent px-5 py-2.5 text-[15px] font-semibold transition-colors",
            "bg-foreground text-background hover:bg-foreground/90",
          )}
        >
          <Compass className="size-4" aria-hidden="true" />
          Get Railyard
        </Link>
        <Link
          to="/railyard/browse"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
            "border-border text-foreground hover:bg-muted/50",
          )}
        >
          Browse Content
        </Link>
        <a
          href="https://github.com/Subway-Builder-Modded"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
            "border-border text-foreground hover:bg-muted/50",
          )}
        >
          <GithubIcon className="size-3.5" />
          GitHub
          <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
