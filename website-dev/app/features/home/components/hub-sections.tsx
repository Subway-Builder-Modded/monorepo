import { ExternalLink, Heart, Users } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";
import {
  HomeSectionHeader,
  TransitActionPanel,
  DestinationRow,
} from "@/app/features/home/components/section-primitives";
import { ANALYTICS_LINKS } from "@/app/features/home/data/homepage-content";

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

const ACTION_PRIMARY = cn(
  "inline-flex items-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors",
  "bg-foreground text-background hover:bg-foreground/90",
);
const ACTION_OUTLINE = cn(
  "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
  "border-border text-foreground hover:bg-muted/50",
);

/* ================================================================== */
/*  2A — COMMUNITY                                                     */
/* ================================================================== */

export function CommunityHubSection() {
  return (
    <section className={cn("py-14 lg:py-20", SHELL)}>
      <HomeSectionHeader
        kicker="Community"
        title="Join the Conversation"
        description="Get support, share feedback, show off your creations, and help shape the roadmap alongside other builders and modders."
      />

      <TransitActionPanel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#5865F2]/10 text-[#5865F2] dark:bg-[#5865F2]/20">
              <FaDiscord className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Discord</p>
              <p className="text-[13px] text-muted-foreground">
                The best place for live support and community.
              </p>
            </div>
          </div>
          <DestinationRow>
            <a
              href="https://discord.gg/syG9YHMyeG"
              target="_blank"
              rel="noopener noreferrer"
              className={ACTION_PRIMARY}
            >
              <FaDiscord className="size-3.5" aria-hidden="true" />
              Join the Discord
              <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
            </a>
            <Link to="/community" className={ACTION_OUTLINE}>
              Community Hub
            </Link>
          </DestinationRow>
        </div>
      </TransitActionPanel>
    </section>
  );
}

/* ================================================================== */
/*  2B — CREDITS + CONTRIBUTE                                          */
/* ================================================================== */

export function CreditsContributeHubSection() {
  return (
    <section className={cn("pb-14 lg:pb-20", SHELL)}>
      <HomeSectionHeader
        kicker="People"
        title="Credits & Contribute"
        description="Meet the team building Subway Builder Modded and support ongoing development."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Credits pane */}
        <TransitActionPanel accentColor="#0a0a0a">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-foreground/70">
              <Users className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Credits</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                The maintainers, collaborators, contributors, and financial supporters who keep the
                ecosystem moving forward.
              </p>
            </div>
          </div>
          <DestinationRow className="mt-4">
            <Link to="/credits" className={ACTION_PRIMARY}>
              <Users className="size-3.5" aria-hidden="true" />
              View Credits
            </Link>
          </DestinationRow>
        </TransitActionPanel>

        {/* Contribute pane */}
        <TransitActionPanel accentColor="#0a0a0a">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-foreground/70">
              <Heart className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Contribute</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Support ongoing development and help ship new features faster while keeping
                everything free and open for everyone.
              </p>
            </div>
          </div>
          <DestinationRow className="mt-4">
            <Link to="/contribute" className={ACTION_PRIMARY}>
              <Heart className="size-3.5" aria-hidden="true" />
              Support the Project
            </Link>
          </DestinationRow>
        </TransitActionPanel>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  2C — OPEN SOURCE + ANALYTICS                                       */
/* ================================================================== */

export function OpenSourceHubSection() {
  return (
    <section className={cn("pb-14 lg:pb-20", SHELL)}>
      <HomeSectionHeader
        kicker="Transparency"
        title="Open Source & Analytics"
        description="Every project is public, every decision transparent. Explore the code or check ecosystem-wide analytics."
      />

      <TransitActionPanel>
        <div className="space-y-5">
          {/* Statement + GitHub */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              All codebases are open with clear contributor workflows — docs, changelogs, and
              roadmaps maintained by the community.
            </p>
            <a
              href="https://github.com/Subway-Builder-Modded"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(ACTION_PRIMARY, "shrink-0")}
            >
              <GithubIcon className="size-3.5" />
              GitHub
              <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
            </a>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60" aria-hidden="true" />

          {/* Analytics links */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Analytics
            </p>
            <div className="flex flex-wrap gap-2">
              {ANALYTICS_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                      "border-border text-foreground hover:bg-muted/50",
                    )}
                  >
                    <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </TransitActionPanel>
    </section>
  );
}
