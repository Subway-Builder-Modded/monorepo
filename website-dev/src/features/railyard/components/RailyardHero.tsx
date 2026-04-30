import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { BookText, Download, Globe, Map, Megaphone, Package, TrainTrack } from "lucide-react";
import { Link } from "@/lib/router";
import { HeroAccentBar } from "@/shared/components/hero-accent-bar";
import { railyardHeroImage } from "@/features/railyard/railyard-assets";
import { RAILYARD_HERO_BODY } from "@/features/railyard/railyard-content";
import { RegistryLatestCarousel } from "@/features/registry/components/shared/RegistryLatestCarousel";
import { fetchRailyardLatestRegistryItems } from "@/features/railyard/railyard-latest-registry";
import {
  buildRailyardDownloadUrl,
  detectRailyardPlatformAccurate,
  detectRailyardPlatform,
  railyardDownloadOptions,
  selectRecommendedRailyardDownload,
} from "@/features/railyard/railyard-downloads";
import type { RailyardRegistrySummary } from "@/features/railyard/railyard-types";

type RailyardHeroProps = {
  summary: RailyardRegistrySummary;
};

const RAILYARD_TITLE = "Railyard";

export function RailyardHero({ summary }: RailyardHeroProps) {
  type LatestRegistryItems = Awaited<ReturnType<typeof fetchRailyardLatestRegistryItems>>;

  const initialRecommendedOption = useMemo(() => {
    const detected =
      typeof window === "undefined"
        ? detectRailyardPlatform(null)
        : detectRailyardPlatform(window.navigator);

    return selectRecommendedRailyardDownload(railyardDownloadOptions, detected);
  }, []);
  const [recommendedOption, setRecommendedOption] = useState(initialRecommendedOption);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    void detectRailyardPlatformAccurate(window.navigator).then((detected) => {
      if (cancelled) {
        return;
      }

      setRecommendedOption(selectRecommendedRailyardDownload(railyardDownloadOptions, detected));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const recommendedUrl = buildRailyardDownloadUrl(recommendedOption);
  const [latestRegistryItems, setLatestRegistryItems] = useState<LatestRegistryItems>([]);

  useEffect(() => {
    void fetchRailyardLatestRegistryItems().then(setLatestRegistryItems).catch(() => {});
  }, []);

  return (
    <section className="relative -mt-12 flex min-h-[100svh] flex-col justify-center overflow-hidden border-b border-border/40 bg-background pb-12 pt-[calc(3rem+3rem)] sm:pb-14 sm:pt-[calc(3rem+3.5rem)] lg:pb-16 lg:pt-[calc(3rem+4rem)]">
      <div className="pointer-events-none absolute inset-0" aria-hidden={true}>
        <img
          src={railyardHeroImage.light}
          alt=""
          className="absolute inset-0 block size-full object-cover dark:hidden"
          style={{ objectPosition: railyardHeroImage.focalPointLight }}
        />
        <img
          src={railyardHeroImage.dark}
          alt=""
          className="absolute inset-0 hidden size-full object-cover dark:block"
          style={{ objectPosition: railyardHeroImage.focalPointDark }}
        />
        <div className="absolute inset-0 bg-background/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_40%,color-mix(in_srgb,var(--suite-accent-light)_22%,transparent),transparent_68%)] dark:bg-[radial-gradient(circle_at_68%_40%,color-mix(in_srgb,var(--suite-accent-dark)_28%,transparent),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/45 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[1.5px]" />
      </div>

      <div className="relative z-10 grid w-full gap-8 px-5 sm:px-7 md:px-9 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.22fr)] lg:items-center lg:gap-10 lg:px-12 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.28fr)]">
        <div className="space-y-6 text-left lg:pr-2 xl:pr-4">
          <div className="space-y-3">
            <h1 className="flex items-center gap-3 text-[clamp(2.6rem,7vw,5rem)] font-extrabold leading-[0.92] tracking-[-0.04em] text-foreground">
              <TrainTrack
                className="size-[0.9em] shrink-0 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                aria-hidden={true}
              />
              <span>{RAILYARD_TITLE}</span>
            </h1>
            <p className="max-w-[clamp(22rem,28vw,30rem)] text-[clamp(1rem,1.8vw,1.18rem)] leading-relaxed text-foreground/78">
              {RAILYARD_HERO_BODY}
            </p>
          </div>

          <div className="flex w-fit flex-col items-center gap-2">
            <Button asChild size="lg" className="h-12 px-7 text-sm font-bold tracking-[-0.01em]">
              <a href={recommendedUrl}>
                <Download className="size-4.5" aria-hidden={true} />
                Install Railyard ({recommendedOption.label})
              </a>
            </Button>
            <a
              href="#all-downloads"
              className="inline-flex text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-[var(--suite-accent-light)] dark:hover:text-[var(--suite-accent-dark)]"
            >
              View all downloads
            </a>
          </div>

          <div className="flex flex-wrap justify-start gap-2.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 rounded-md px-3.5">
                    <Link to="/registry">
                      <Map className="size-3.5" aria-hidden={true} />
                      {summary.mapsCount} Maps
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[140]">
                  Browse Maps
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 rounded-md px-3.5">
                    <Link to="/registry">
                      <Package className="size-3.5" aria-hidden={true} />
                      {summary.modsCount} Mods
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[140]">
                  Browse Mods
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="icon-sm" className="rounded-md">
                    <Link to="/railyard/updates">
                      <Megaphone className="size-4" aria-hidden={true} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[140]">
                  Open Updates
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
                    className="rounded-md"
                   
                  >
                    <Link to="/railyard/docs">
                      <BookText className="size-4" aria-hidden={true} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[140]">
                  Open Documentation
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="icon-sm" className="rounded-md">
                    <Link to="/registry/world-map">
                      <Globe className="size-4" aria-hidden={true} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[140]">
                  Open World Map
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <RegistryLatestCarousel items={latestRegistryItems} />
      </div>

      <HeroAccentBar
        segments={[
          { light: "#0f8f68", dark: "#19d89c" },
          { light: "#0b7a5a", dark: "#14c48c" },
          { light: "#0f8f68", dark: "#19d89c" },
          { light: "#0b7a5a", dark: "#14c48c" },
          { light: "#0f8f68", dark: "#19d89c" },
        ]}
      />
    </section>
  );
}
