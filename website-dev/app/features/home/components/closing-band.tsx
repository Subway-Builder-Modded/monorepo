import { ExternalLink, Compass } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const SHELL = "mx-auto w-full max-w-[1360px] px-5 sm:px-7 lg:px-10 xl:px-12";

export function ClosingBand() {
  return (
    <section className={cn("relative py-16 lg:py-24", SHELL)}>
      {/* Terminus motif — thin colored bars */}
      <div className="mb-8 flex items-center gap-1.5" aria-hidden="true">
        {["#0039A6", "#FF6319", "#00933C", "#FCCC0A", "#752F82"].map((c) => (
          <span key={c} className="h-0.5 w-6 rounded-full" style={{ backgroundColor: c }} />
        ))}
      </div>

      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        The last stop is wherever you take it.
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
        Join the community, contribute to the source, or start building your first mod today.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <a
          href="https://discord.gg/syG9YHMyeG"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors",
            "bg-foreground text-background hover:bg-foreground/90",
          )}
        >
          <FaDiscord className="size-3.5" aria-hidden="true" />
          Community
          <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
        </a>
        <a
          href="https://github.com/Subway-Builder-Modded"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            "border-border text-foreground hover:bg-muted/50",
          )}
        >
          <GithubIcon className="size-3.5" />
          GitHub
          <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
        </a>
        <Link
          to="/railyard/browse"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            "border-border text-foreground hover:bg-muted/50",
          )}
        >
          <Compass className="size-3.5" aria-hidden="true" />
          Browse Content
        </Link>
      </div>
    </section>
  );
}
