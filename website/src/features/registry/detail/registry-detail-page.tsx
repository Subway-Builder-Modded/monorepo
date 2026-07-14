import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Download, Loader2, Users } from "lucide-react";
import {
  NeutralFadedUnderline,
  SuiteAccentScope,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { getCountryFlagIcon } from "@/lib/country-flags";
import { Link, navigate } from "@/lib/router";
import { NotFoundPage } from "@/features/not-found";
import { buildRailyardDeeplink } from "@/features/registry/detail/lib/build-railyard-deeplink";
import { loadRegistryDetail } from "@/features/registry/detail/lib/load-registry-detail";
import { normalizeRegistryDetail } from "@/features/registry/detail/lib/normalize-registry-detail";
import { getRegistryMapBasemapUrl } from "@/features/registry/lib/registry-asset-paths";
import { getRegistryDetailUrl } from "@/features/registry/lib/routing";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";
import { DetailsTab } from "@/features/registry/detail/components/details-tab";
import { AnalyticsTab } from "@/features/registry/detail/components/analytics-tab";
import { DescriptionTab } from "@/features/registry/detail/components/description-tab";
import { GalleryLightbox } from "@/features/registry/detail/components/gallery-lightbox";
import { GalleryTab } from "@/features/registry/detail/components/gallery-tab";
import { MapTab } from "@/features/registry/detail/components/map-tab";
import { OpenInRailyardDialog } from "@/features/registry/detail/components/open-in-railyard-dialog";
import { RegistryDetailHeader } from "@/features/registry/detail/components/registry-detail-header";
import { RegistryDetailSidebar } from "@/features/registry/detail/components/registry-detail-sidebar";
import { RegistryDetailTabs } from "@/features/registry/detail/components/registry-detail-tabs";
import { VersionsTab } from "@/features/registry/detail/components/versions-tab";
import { useFloatingAnchorVisibility } from "@/features/registry/detail/hooks/use-floating-anchor-visibility";
import { preloadDetailTabAssets } from "@/features/registry/detail/lib/preload-detail-tab-assets";
import {
  REGISTRY_DETAIL_TAB_ITEMS,
  resolveRegistryDetailTabId,
} from "@/features/registry/detail/lib/detail-tab-items";
import {
  getRegistryDetailTabsForType,
  getRegistryTypeUiRules,
  type RegistryDetailTabId,
} from "@/features/registry/registry-type-ui";

type RegistryDetailPageProps = {
  routeSegment: string;
  id: string;
  tabId?: string;
  versionId?: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function RegistryDetailPage({
  routeSegment,
  id,
  tabId,
  versionId,
}: RegistryDetailPageProps) {
  const suite = getSuiteById("registry");
  const railyardSuite = getSuiteById("railyard");
  const [detail, setDetail] = useState<RegistryDetailModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeTab = resolveRegistryDetailTabId(tabId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const tabsAnchorRef = useRef<HTMLDivElement | null>(null);
  const sidebarAnchorRef = useRef<HTMLDivElement | null>(null);
  const showFloatingAnchor = useFloatingAnchorVisibility({
    enabled: Boolean(detail),
    tabsAnchorRef,
    sidebarAnchorRef,
  });

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setDetail(null);

    void (async () => {
      try {
        const loaded = await loadRegistryDetail(routeSegment, id);
        if (isCancelled) {
          return;
        }

        if (!loaded) {
          setDetail(null);
          return;
        }

        const normalized = normalizeRegistryDetail(loaded);
        setDetail(normalized);
        setIsLoading(false);

        void preloadDetailTabAssets(normalized).catch(() => {});
      } catch {
        if (!isCancelled) {
          setDetail(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [id, routeSegment]);

  const accentColor = useMemo(() => {
    if (!detail) {
      return "#6b7280";
    }
    return `light-dark(${detail.typeConfig.accentLight}, ${detail.typeConfig.accentDark})`;
  }, [detail]);

  const railyardAccentLight = railyardSuite.accent.light;
  const railyardAccentDark = railyardSuite.accent.dark;
  const mapBasemapSrc =
    detail && getRegistryTypeUiRules(detail.typeId).showBasemapBackground
      ? getRegistryMapBasemapUrl(detail.id)
      : null;

  if (isLoading) {
    return (
      <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
        <div className="relative isolate flex min-h-[55vh] items-center justify-center px-5 py-6 sm:px-7 md:px-9 lg:px-12">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2
              className="size-11 animate-spin will-change-transform motion-reduce:animate-none"
              aria-hidden={true}
            />
            <span className="text-2xl font-semibold tracking-tight">Loading...</span>
          </div>
        </div>
      </SuiteAccentScope>
    );
  }

  if (!detail) {
    return <NotFoundPage />;
  }

  const openImageAt = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const openRailyard = () => {
    const deeplink = buildRailyardDeeplink(detail.routeSegment, detail.id);
    window.location.href = deeplink;
  };

  const countryCode = detail.mapFields?.countryCode ?? null;
  const CountryFlagIcon = getCountryFlagIcon(countryCode);
  const typeUiRules = getRegistryTypeUiRules(detail.typeId);
  const TypeIcon = typeUiRules.typeIcon;
  const floatingTopOffset = "calc(1rem + 3.35rem)";
  const allowedTabIds = new Set<RegistryDetailTabId>(getRegistryDetailTabsForType(detail.typeId));
  const visibleActiveTab = allowedTabIds.has(activeTab) ? activeTab : "description";
  const floatingTabItems = REGISTRY_DETAIL_TAB_ITEMS.filter((tab) => allowedTabIds.has(tab.id));

  return (
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <div
        className="relative isolate w-full px-5 py-6 sm:px-7 md:px-9 lg:px-12"
        style={{
          ["--registry-type-accent" as string]: accentColor,
          ["--registry-type-accent-strong" as string]: detail.typeConfig.accentLight,
        }}
      >
        {mapBasemapSrc ? (
          <div aria-hidden={true} className="pointer-events-none fixed inset-0 z-0">
            <img
              data-testid="map-basemap-background"
              src={mapBasemapSrc}
              alt=""
              className="absolute left-1/2 top-1/2 h-screen w-screen -translate-x-1/2 -translate-y-1/2 object-cover object-center opacity-20"
              draggable={false}
            />
          </div>
        ) : null}

        <div
          className="pointer-events-none fixed inset-x-0 z-40 hidden px-5 sm:px-7 md:px-9 lg:block lg:px-12"
          style={{ top: floatingTopOffset }}
          aria-hidden={!showFloatingAnchor}
        >
          <div
            className={`mx-auto w-full transform transition-all duration-300 ease-out ${
              showFloatingAnchor
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0"
            }`}
          >
            <section
              className="rounded-2xl border px-3.5 py-2 shadow-[0_18px_42px_-24px_rgba(var(--elevation-shadow-rgb),0.75)] sm:px-4 sm:py-2.5"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--registry-type-accent-strong) 42%, var(--border))",
                backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
              }}
            >
              <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-12">
                <div className="flex min-w-0 items-center gap-4 self-center text-base font-medium leading-none text-muted-foreground">
                  {detail.downloads !== null ? (
                    <span className="inline-flex h-8 items-center gap-1.5">
                      <ArrowDownToLine className="size-5" aria-hidden={true} />
                      <span className="tabular-nums">
                        {numberFormatter.format(detail.downloads)}
                      </span>
                    </span>
                  ) : null}

                  {typeUiRules.hasMapMetadata &&
                  detail.mapFields?.population !== null &&
                  detail.mapFields?.population !== undefined ? (
                    <span className="inline-flex h-8 items-center gap-1.5">
                      <Users className="size-5" aria-hidden={true} />
                      <span className="tabular-nums">
                        {numberFormatter.format(detail.mapFields.population)}
                      </span>
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 self-center text-center">
                  <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 leading-none lg:flex-nowrap">
                    <Link
                      to={`/registry/${detail.routeSegment}`}
                      preserveScroll={true}
                      className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-sm font-semibold leading-none"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--registry-type-accent-strong) 34%, transparent)",
                        background:
                          "color-mix(in srgb, var(--registry-type-accent-strong) 14%, transparent)",
                        color: "var(--registry-type-accent-strong)",
                      }}
                    >
                      <TypeIcon className="size-4" aria-hidden={true} />
                      {detail.typeConfig.label}
                    </Link>
                    <p className="relative inline-flex max-w-full items-center text-xl font-semibold leading-[1.1] tracking-tight text-foreground">
                      <span className="truncate">{detail.name}</span>
                      <NeutralFadedUnderline className="pointer-events-none absolute -bottom-[0.2em] left-0 right-0" />
                    </p>

                    {typeUiRules.hasMapMetadata && detail.mapFields?.country ? (
                      <span className="inline-flex h-8 items-center gap-1.5 text-base font-semibold leading-none text-muted-foreground">
                        {detail.mapFields.cityCode ? (
                          <span className="uppercase">{detail.mapFields.cityCode}</span>
                        ) : null}
                        {detail.mapFields.cityCode ? (
                          <span
                            aria-hidden={true}
                            className="inline-block h-3.5 w-px bg-[color-mix(in_srgb,var(--muted-foreground)_55%,transparent)]"
                          />
                        ) : null}
                        {CountryFlagIcon ? (
                          <CountryFlagIcon
                            aria-hidden={true}
                            className="h-4 w-6 rounded-[2px] border border-border/60 object-cover"
                          />
                        ) : null}
                        <span>{detail.mapFields.country}</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="self-center justify-self-end">
                  <TooltipProvider>
                    <div className="relative flex items-center justify-end gap-2 whitespace-nowrap text-base">
                      {floatingTabItems.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = visibleActiveTab === tab.id;

                        return (
                          <Tooltip key={tab.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={tab.label}
                                className={`relative inline-flex h-8 items-center justify-center px-1.5 transition-colors sm:h-8 sm:px-2 ${
                                  isActive
                                    ? "text-[var(--registry-type-accent-strong)]"
                                    : "text-muted-foreground hover:text-[var(--registry-type-accent-strong)]"
                                }`}
                                onClick={() => {
                                  const nextUrl = getRegistryDetailUrl(routeSegment, id, tab.id);
                                  navigate(nextUrl, { preserveScroll: true });
                                }}
                              >
                                <Icon className="size-5" aria-hidden={true} />
                                <span
                                  className={`pointer-events-none absolute -bottom-[0.64rem] left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-[var(--registry-type-accent-strong)] transition-opacity ${
                                    isActive ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="z-[140]">
                              {tab.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Download"
                            className="relative inline-flex h-8 items-center justify-center px-1.5 text-muted-foreground transition-colors hover:text-[var(--registry-type-accent-strong)] sm:h-8 sm:px-2"
                            onClick={() => setDialogOpen(true)}
                          >
                            <Download className="size-5" aria-hidden={true} />
                            <ArrowUpRight
                              className="absolute right-0.5 top-1.5 size-2.5"
                              aria-hidden={true}
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="z-[140]">
                          Download
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <RegistryDetailHeader
            detail={detail}
            accentColor={accentColor}
            onOpenInRailyard={() => setDialogOpen(true)}
            onOpenImage={openImageAt}
          />

          <div className="space-y-5">
            <div ref={tabsAnchorRef}>
              <RegistryDetailTabs
                value={visibleActiveTab}
                typeId={detail.typeId}
                onValueChange={(nextTab) => {
                  const nextUrl = getRegistryDetailUrl(routeSegment, id, nextTab);
                  navigate(nextUrl, { preserveScroll: true });
                }}
              />
            </div>

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(220px,0.8fr)] lg:items-start">
              <main className="min-w-0">
                <section
                  className="rounded-xl border border-border/70 p-4 sm:p-5"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
                  }}
                >
                  <div hidden={visibleActiveTab !== "description"}>
                    <DescriptionTab description={detail.description} />
                  </div>
                  <div hidden={visibleActiveTab !== "analytics"}>
                    <AnalyticsTab detail={detail} />
                  </div>
                  <div hidden={visibleActiveTab !== "details"}>
                    <DetailsTab detail={detail} />
                  </div>
                  <div hidden={visibleActiveTab !== "gallery"}>
                    <GalleryTab
                      itemName={detail.name}
                      images={detail.galleryImages}
                      onOpen={openImageAt}
                    />
                  </div>
                  <div hidden={visibleActiveTab !== "versions"}>
                    <VersionsTab
                      versions={detail.versions}
                      routeSegment={detail.routeSegment}
                      listingId={detail.id}
                      versionSource={detail.versionSource}
                      selectedVersionId={versionId}
                    />
                  </div>
                  <div hidden={visibleActiveTab !== "map"}>
                    <MapTab mapId={detail.id} />
                  </div>
                </section>
              </main>

              <div
                ref={sidebarAnchorRef}
                aria-hidden={true}
                className="pointer-events-none absolute right-0 top-0 hidden h-0 w-0 lg:block"
              />
              <RegistryDetailSidebar
                detail={detail}
                accentColor={accentColor}
                onOpenImage={openImageAt}
              />
            </div>
          </div>
        </div>
      </div>

      <OpenInRailyardDialog
        open={dialogOpen}
        itemName={detail.name}
        itemThumbnailSrc={detail.galleryImages[0] ?? null}
        latestDownloadUrl={detail.latestDownloadUrl}
        railyardAccentLight={railyardAccentLight}
        railyardAccentDark={railyardAccentDark}
        onOpenChange={setDialogOpen}
        onOpenRailyard={openRailyard}
      />

      <GalleryLightbox
        open={lightboxOpen}
        images={detail.galleryImages}
        currentIndex={lightboxIndex}
        accentColor={accentColor}
        onOpenChange={setLightboxOpen}
        onPrevious={() =>
          setLightboxIndex((current) => {
            if (detail.galleryImages.length === 0) {
              return 0;
            }
            return (current - 1 + detail.galleryImages.length) % detail.galleryImages.length;
          })
        }
        onNext={() =>
          setLightboxIndex((current) => {
            if (detail.galleryImages.length === 0) {
              return 0;
            }
            return (current + 1) % detail.galleryImages.length;
          })
        }
      />
    </SuiteAccentScope>
  );
}
