import { useEffect, useState } from "react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import {
  BookText,
  ChartLine,
  Download,
  Globe,
  Map,
  Megaphone,
  Package,
  TrainTrack,
} from "lucide-react";
import { Link } from "@/lib/router";
import { RAILYARD_HERO_BODY } from "@/features/railyard/railyard-content";
import { RegistryLatestCarousel } from "@/features/registry/components/shared/registry-latest-carousel";
import { fetchRailyardLatestRegistryItems } from "@/features/railyard/railyard-latest-registry";
import type { RailyardRegistrySummary } from "@/features/railyard/railyard-types";

type RailyardHeroProps = {
  summary: RailyardRegistrySummary;
  isSummaryLoading: boolean;
};

const RAILYARD_TITLE = "Railyard";

export function RailyardHero({ summary, isSummaryLoading }: RailyardHeroProps) {
  type LatestRegistryItems = Awaited<ReturnType<typeof fetchRailyardLatestRegistryItems>>;

  const [latestRegistryItems, setLatestRegistryItems] = useState<LatestRegistryItems>([]);
  const [isLatestRegistryLoading, setIsLatestRegistryLoading] = useState(true);

  useEffect(() => {
    setIsLatestRegistryLoading(true);

    void fetchRailyardLatestRegistryItems()
      .then(setLatestRegistryItems)
      .catch(() => {})
      .finally(() => setIsLatestRegistryLoading(false));
  }, []);

  return (
    <section className="relative flex h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] items-center overflow-visible border-b border-border/45 bg-background">
      <div className="pointer-events-none absolute -top-12 inset-x-0 bottom-0" aria-hidden={true}>
        {" "}
        {/* Route map background */}
        <img
          src="/assets/geojson/ZRH.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 dark:opacity-25 [filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--suite-accent-light)_70%,transparent))_drop-shadow(0_0_6px_color-mix(in_srgb,var(--suite-accent-light)_50%,transparent))] dark:[filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--suite-accent-dark)_70%,transparent))_drop-shadow(0_0_6px_color-mix(in_srgb,var(--suite-accent-dark)_50%,transparent))]"
          draggable={false}
        />{" "}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,color-mix(in_srgb,var(--suite-accent-light)_24%,transparent),transparent_58%)] dark:bg-[radial-gradient(circle_at_22%_28%,color-mix(in_srgb,var(--suite-accent-dark)_28%,transparent),transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_96%,color-mix(in_srgb,var(--suite-accent-light)_24%,transparent)_100%),linear-gradient(90deg,color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)_1px,transparent_1px),linear-gradient(color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)_1px,transparent_1px)] bg-[length:100%_100%,56px_56px,56px_56px] dark:bg-[linear-gradient(transparent_0%,transparent_96%,color-mix(in_srgb,var(--suite-accent-dark)_30%,transparent)_100%),linear-gradient(90deg,color-mix(in_srgb,var(--suite-accent-dark)_26%,transparent)_1px,transparent_1px),linear-gradient(color-mix(in_srgb,var(--suite-accent-dark)_26%,transparent)_1px,transparent_1px)]" />
      </div>

      <div className="relative z-10 grid w-full gap-8 px-5 sm:px-7 md:px-9 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.22fr)] lg:items-center lg:gap-10 lg:px-12">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="flex items-center gap-3 text-[clamp(2.8rem,7vw,5.6rem)] font-extrabold tracking-[-0.05em] text-foreground">
              <TrainTrack
                className="size-[0.85em] shrink-0 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                aria-hidden={true}
              />
              <span>{RAILYARD_TITLE}</span>
            </h1>
            <p className="max-w-lg text-[clamp(1rem,1.8vw,1.2rem)] leading-relaxed text-foreground/82">
              {RAILYARD_HERO_BODY}
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2.5 sm:w-[24rem] sm:flex-nowrap">
            <Button
              asChild
              size="lg"
              className="h-12 px-7 text-sm font-bold tracking-[-0.01em] sm:flex-1"
            >
              <a href="#downloads">
                <Download className="size-4.5" aria-hidden={true} />
                Downloads
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-6 text-sm font-semibold sm:flex-1"
            >
              <Link to="/railyard/docs">
                <BookText className="size-4.5" aria-hidden={true} />
                Documentation
              </Link>
            </Button>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-[24rem] sm:flex-nowrap sm:justify-between">
            {isSummaryLoading ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  aria-busy={true}
                  className="h-8 gap-1.5 rounded-lg border-border/55 bg-muted/30 px-3 text-foreground/70 sm:flex-1"
                >
                  <Map className="size-3.5" aria-hidden={true} />
                  <span
                    className="h-3 w-14 animate-pulse rounded bg-foreground/20"
                    aria-hidden={true}
                  />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  aria-busy={true}
                  className="h-8 gap-1.5 rounded-lg border-border/55 bg-muted/30 px-3 text-foreground/70 sm:flex-1"
                >
                  <Package className="size-3.5" aria-hidden={true} />
                  <span
                    className="h-3 w-14 animate-pulse rounded bg-foreground/20"
                    aria-hidden={true}
                  />
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg border-border/55 px-3 text-foreground/75 hover:border-border hover:text-foreground sm:flex-1"
                >
                  <Link to="/registry">
                    <Map className="size-3.5" aria-hidden={true} />
                    {summary.mapsCount} Maps
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg border-border/55 px-3 text-foreground/75 hover:border-border hover:text-foreground sm:flex-1"
                >
                  <Link to="/registry">
                    <Package className="size-3.5" aria-hidden={true} />
                    {summary.modsCount} Mods
                  </Link>
                </Button>
              </>
            )}

            <div className="hidden h-4 w-px bg-border/60 sm:block" aria-hidden={true} />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="outline"
                    size="icon-sm"
                    className="h-8 w-8 rounded-lg border-border/55 text-foreground/75 hover:border-border hover:text-foreground"
                  >
                    <Link to="/railyard/updates">
                      <Megaphone className="size-3.5" aria-hidden={true} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[140]">
                  Updates
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="outline"
                    size="icon-sm"
                    className="h-8 w-8 rounded-lg border-border/55 text-foreground/75 hover:border-border hover:text-foreground"
                  >
                    <Link to="/railyard/analytics">
                      <ChartLine className="size-3.5" aria-hidden={true} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[140]">
                  Analytics
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="outline"
                    size="icon-sm"
                    className="h-8 w-8 rounded-lg border-border/55 text-foreground/75 hover:border-border hover:text-foreground"
                  >
                    <Link to="/registry/world-map">
                      <Globe className="size-3.5" aria-hidden={true} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[140]">
                  World Map
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <RegistryLatestCarousel items={latestRegistryItems} isLoading={isLatestRegistryLoading} />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-1 bg-[var(--suite-accent-light)] dark:bg-[var(--suite-accent-dark)]"
        aria-hidden={true}
      />
    </section>
  );
}
