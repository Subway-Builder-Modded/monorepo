import { DiscordIcon } from "@subway-builder-modded/icons";
import { House } from "lucide-react";
import { COMMUNITY_DISCORD_LINK } from "@/config/community";
import { NotFoundRouteSign } from "@/features/not-found/components/not-found-route-sign";
import { Link } from "@/lib/router";

export function NotFoundPage() {
  return (
    <section className="flex min-h-[calc(100svh-3rem)] items-center justify-center px-5 py-10 sm:px-7 md:px-9 lg:px-12">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <div className="mx-auto w-full max-w-xl">
          <NotFoundRouteSign />
        </div>

        <div className="flex flex-col items-center gap-2.5 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <House aria-hidden={true} className="size-5" />
            Home
          </Link>

          <a
            href={COMMUNITY_DISCORD_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <DiscordIcon aria-hidden="true" className="size-5" />
            Discord
          </a>
        </div>
      </div>
    </section>
  );
}
