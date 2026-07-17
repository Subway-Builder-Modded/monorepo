import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import { cn } from "@subway-builder-modded/shared-ui";
import { getRegistryItemCachePath } from "@/features/registry/lib/registry-asset-paths";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { MapViewIndicator } from "@/features/registry/detail/components/map-view-indicator";
import {
  compactNumber,
  formatCoord,
  formatMetricValue,
  HEAT_COLORS_BY_THEME,
  METRIC_CONFIG,
  METRIC_ORDER,
  readNumericProperty,
} from "./map-tab-metrics";
import { expandBboxByFactor, normalizeMapGrid } from "./map-tab-grid";
import { buildThemedStyle } from "./map-tab-style";
import type {
  Bbox,
  GridSnapshot,
  HoverInfo,
  MapLibreBoundsLike,
  MetricId,
  ResolvedTheme,
} from "./map-tab-types";
const GRID_SOURCE_ID = "registry-grid-source";
const HEAT_LAYER_PREFIX = "registry-grid-heat-";
const INITIAL_BOUNDS_EXPANSION_FACTOR = 1.16;
const MAX_BOUNDS_EXPANSION_FACTOR = 1.9;

function isMapTheme(value: string | undefined): value is ResolvedTheme {
  return value === "light" || value === "dark";
}

async function loadMaplibre() {
  const maplibre = await import("maplibre-gl");
  return maplibre.default;
}

export function MapTab({ mapId }: { mapId: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const activeMetricRef = useRef<MetricId>("residentCount");
  const { resolvedTheme } = useThemeMode();
  const [snapshot, setSnapshot] = useState<GridSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [activeMetric, setActiveMetric] = useState<MetricId>("residentCount");
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [isMapRenderReady, setIsMapRenderReady] = useState(false);

  useEffect(() => {
    activeMetricRef.current = activeMetric;
  }, [activeMetric]);

  const mapTheme: ResolvedTheme = isMapTheme(resolvedTheme) ? resolvedTheme : "dark";
  const heatColors = HEAT_COLORS_BY_THEME[mapTheme];

  useEffect(() => {
    let canceled = false;
    setStatus("loading");
    setSnapshot(null);
    setHoverInfo(null);
    setIsMapRenderReady(false);

    void (async () => {
      try {
        const response = await fetch(getRegistryItemCachePath("maps", mapId, "grid.geojson"), {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!canceled) setStatus("empty");
          return;
        }

        const payload = (await response.json()) as unknown;
        const normalized = normalizeMapGrid(mapId, payload);

        if (!canceled) {
          setSnapshot(normalized);
          setStatus("ready");
        }
      } catch {
        if (!canceled) setStatus("error");
      }
    })();

    return () => {
      canceled = true;
    };
  }, [mapId]);

  useEffect(() => {
    if (status !== "ready" || !snapshot || !containerRef.current) return;

    let disposed = false;
    let map: any = null;
    let handleLoad: (() => void) | null = null;
    setIsMapRenderReady(false);

    void (async () => {
      try {
        const maplibregl = await loadMaplibre();
        const style = await buildThemedStyle(mapTheme);
        if (disposed || !containerRef.current) return;

        map = new maplibregl.Map({
          container: containerRef.current,
          style,
          attributionControl: false,
          interactive: true,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          renderWorldCopies: false,
        });
        mapRef.current = map;

        handleLoad = () => {
          if (!map || disposed) return;
          if (!map.getSource?.(GRID_SOURCE_ID)) {
            map.addSource(GRID_SOURCE_ID, {
              type: "geojson",
              data: snapshot.geojson,
            });

            for (const metricId of METRIC_ORDER) {
              const stats = snapshot.metrics?.[metricId];
              const recommendedMax =
                stats?.recommendedMax && stats.recommendedMax > 0 ? stats.recommendedMax : 1;
              const stops = heatColors.map((color, index) => [
                (recommendedMax * index) / (heatColors.length - 1),
                color,
              ]);

              map.addLayer({
                id: `${HEAT_LAYER_PREFIX}${metricId}`,
                type: "fill",
                source: GRID_SOURCE_ID,
                layout: {
                  visibility: metricId === activeMetricRef.current ? "visible" : "none",
                },
                paint: {
                  "fill-color": [
                    "interpolate",
                    ["linear"],
                    ["coalesce", ["get", metricId], 0],
                    ...stops.flat(),
                  ],
                  "fill-opacity": 0.62,
                },
              });
            }
          }

          const initialBounds = expandBboxByFactor(snapshot.bbox, INITIAL_BOUNDS_EXPANSION_FACTOR);
          const boundsForMap: MapLibreBoundsLike = [
            [initialBounds[0], initialBounds[1]],
            [initialBounds[2], initialBounds[3]],
          ];

          map.fitBounds(boundsForMap, {
            padding: 28,
            duration: 0,
            maxZoom: 14,
          });

          const initialZoom = map.getZoom();
          const initialViewportBounds = map.getBounds().toArray();
          const initialViewportBbox: Bbox = [
            initialViewportBounds[0][0],
            initialViewportBounds[0][1],
            initialViewportBounds[1][0],
            initialViewportBounds[1][1],
          ];
          const maxBoundsExpanded = expandBboxByFactor(
            initialViewportBbox,
            MAX_BOUNDS_EXPANSION_FACTOR,
          );
          const maxBoundsForMap: MapLibreBoundsLike = [
            [maxBoundsExpanded[0], maxBoundsExpanded[1]],
            [maxBoundsExpanded[2], maxBoundsExpanded[3]],
          ];

          map.setMinZoom(initialZoom - 1.2);
          map.setMaxBounds(maxBoundsForMap);

          const handleMove = (event: unknown) => {
            const e = event as { point?: { x: number; y: number } } | undefined;
            if (!e?.point || !map?.queryRenderedFeatures) return;
            const activeLayerId = `${HEAT_LAYER_PREFIX}${activeMetricRef.current}`;

            let features: Array<{ properties?: Record<string, unknown> }> = [];
            try {
              features = map.queryRenderedFeatures(e.point, {
                layers: [activeLayerId],
              });
            } catch {
              return;
            }

            const feature = features?.[0];
            const properties = (feature?.properties ?? {}) as Record<string, unknown>;
            if (!feature || !properties) {
              setHoverInfo(null);
              return;
            }

            const values = METRIC_ORDER.reduce(
              (acc, metricId) => {
                acc[metricId] = readNumericProperty(properties, metricId);
                return acc;
              },
              {} as Record<MetricId, number>,
            );

            const centroidLng = (() => {
              const value = Number(properties.centroidLng);
              return Number.isFinite(value) ? value : null;
            })();
            const centroidLat = (() => {
              const value = Number(properties.centroidLat);
              return Number.isFinite(value) ? value : null;
            })();

            setHoverInfo({
              x: e.point.x,
              y: e.point.y,
              values,
              centroidLng,
              centroidLat,
            });
          };

          const handleLeave = () => setHoverInfo(null);
          map.on("mousemove", handleMove);
          map.on("mouseleave", handleLeave);

          const markMapReady = () => {
            if (!disposed) {
              setIsMapRenderReady(true);
            }
          };

          map.once("idle", markMapReady);
        };

        map.on("load", handleLoad);
        if (map.isStyleLoaded?.()) handleLoad();
      } catch {
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      if (map && handleLoad) map.off("load", handleLoad);
      mapRef.current = null;
      map?.remove();
    };
  }, [heatColors, mapTheme, snapshot, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const metricId of METRIC_ORDER) {
      map.setLayoutProperty(
        `${HEAT_LAYER_PREFIX}${metricId}`,
        "visibility",
        metricId === activeMetric ? "visible" : "none",
      );
    }
  }, [activeMetric]);

  const metricStats = snapshot?.metrics?.[activeMetric];
  const legendMin = metricStats?.min ?? 0;
  const legendMax = metricStats?.recommendedMax ?? metricStats?.max ?? 0;

  const summaryText = useMemo(() => {
    if (!snapshot || !metricStats) return "";
    return `${compactNumber(metricStats.nonZeroCount)} active cells`;
  }, [metricStats, snapshot]);

  const activeMetricIndex = METRIC_ORDER.indexOf(activeMetric);
  const activeMetricConfig = METRIC_CONFIG[activeMetric];
  const ActiveMetricIcon = activeMetricConfig.icon;

  const setMetricByOffset = (offset: number) => {
    const nextIndex = (activeMetricIndex + offset + METRIC_ORDER.length) % METRIC_ORDER.length;
    setActiveMetric(METRIC_ORDER[nextIndex]);
  };

  if (status === "loading") {
    return (
      <div className="flex h-[26rem] items-center justify-center rounded-xl border border-border/65 bg-muted/25 text-sm text-muted-foreground lg:h-full">
        Loading...
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="flex h-[26rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center lg:h-full">
        <MapPin className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden={true} />
        <p className="text-sm text-muted-foreground">Heatmap grid data is not available.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-[26rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center lg:h-full">
        <AlertCircle className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden={true} />
        <p className="text-sm text-muted-foreground">Unable to load map heatmap data right now.</p>
      </div>
    );
  }

  return (
    <div className="registry-map-tab space-y-3 lg:flex lg:h-full lg:flex-col">
      <MapViewIndicator
        icon={ActiveMetricIcon}
        viewName={activeMetricConfig.shortLabel}
        currentPage={activeMetricIndex + 1}
        totalPages={METRIC_ORDER.length}
        onPrevious={() => setMetricByOffset(-1)}
        onNext={() => setMetricByOffset(1)}
      />

      <div className="overflow-visible rounded-xl border border-border/60 bg-card/65 p-1.5 ring-1 ring-foreground/5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="relative h-[26rem] w-full overflow-visible rounded-lg lg:h-auto lg:min-h-0 lg:flex-1">
          <div className="h-full w-full overflow-hidden rounded-lg">
            <div
              ref={containerRef}
              className={cn(
                "h-full w-full transition-opacity duration-200",
                isMapRenderReady ? "opacity-100" : "opacity-0",
              )}
              aria-label="City map"
            />
          </div>

          {!isMapRenderReady ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-card/92 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2
                  className="size-7 animate-spin will-change-transform motion-reduce:animate-none"
                  aria-hidden={true}
                />
                <span className="text-sm font-medium">Loading...</span>
              </div>
            </div>
          ) : null}

          {hoverInfo ? (
            <div
              className="pointer-events-none absolute z-40 w-[18rem] rounded-lg border border-border/70 bg-card/95 p-3 text-foreground shadow-xl backdrop-blur-sm"
              style={{
                left: `${hoverInfo.x}px`,
                top: `${hoverInfo.y}px`,
                transform: "translate(14px, 14px)",
              }}
            >
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Grid Cell
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCoord(hoverInfo.centroidLat)}, {formatCoord(hoverInfo.centroidLng)}
              </p>
              <div className="mt-2 space-y-1.5">
                {METRIC_ORDER.map((metricId) => {
                  const isActive = metricId === activeMetric;
                  return (
                    <div
                      key={metricId}
                      className={cn(
                        "flex items-center justify-between text-xs",
                        isActive ? "font-semibold text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span>{METRIC_CONFIG[metricId].shortLabel}</span>
                      <span>{formatMetricValue(metricId, hoverInfo.values[metricId] ?? 0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="absolute bottom-2 right-2 z-30 rounded-full border border-border/75 bg-card/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            <div className="whitespace-nowrap leading-none">
              <a
                href="https://openfreemap.org"
                target="_blank"
                rel="noreferrer"
                className="text-foreground/85 decoration-current underline-offset-2 transition-colors hover:text-[var(--registry-type-accent)] hover:underline"
              >
                OpenFreeMap
              </a>
              <span aria-hidden={true}>{" © "}</span>
              <a
                href="https://www.openmaptiles.org"
                target="_blank"
                rel="noreferrer"
                className="text-foreground/85 decoration-current underline-offset-2 transition-colors hover:text-[var(--registry-type-accent)] hover:underline"
              >
                OpenMapTiles
              </a>
              <span>{" Data from "}</span>
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="text-foreground/85 decoration-current underline-offset-2 transition-colors hover:text-[var(--registry-type-accent)] hover:underline"
              >
                OpenStreetMap
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-border/65 bg-muted/20 px-3 py-2">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{METRIC_CONFIG[activeMetric].label}</span>
          <span>{summaryText}</span>
        </div>
        <div
          className="h-2 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${heatColors.join(",")})`,
          }}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatMetricValue(activeMetric, legendMin)}</span>
          <span>{formatMetricValue(activeMetric, legendMax)}</span>
        </div>
      </div>
    </div>
  );
}
