import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Briefcase, Building2, House, Loader2, MapPin, Users } from "lucide-react";
import { cn } from "@subway-builder-modded/shared-ui";
import type { StyleSpecification } from "maplibre-gl";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { MapViewIndicator } from "@/features/registry/detail/components/map-view-indicator";

type Bbox = [number, number, number, number];
type MetricId =
  | "residentCount"
  | "jobCount"
  | "pointDensity"
  | "workToHomeCommuteDistance"
  | "homeToWorkCommuteDistance";

type GridFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
  properties: Record<MetricId, number> & {
    centroidLng?: number;
    centroidLat?: number;
  };
};

type GridSnapshot = {
  mapId: string;
  bbox: Bbox;
  featureCount: number;
  metrics: Record<
    MetricId,
    {
      min: number;
      max: number;
      p95: number;
      p98: number;
      recommendedMax: number;
      nonZeroCount: number;
    }
  >;
  geojson: {
    type: "FeatureCollection";
    features: GridFeature[];
  };
};

type MapLibreBoundsLike = [[number, number], [number, number]];

type HoverInfo = {
  x: number;
  y: number;
  values: Record<MetricId, number>;
  centroidLng: number | null;
  centroidLat: number | null;
};

type ResolvedTheme = "light" | "dark";

type SubwayThemeColors = {
  roads: string;
  buildings: string;
  water: string;
  background: string;
  parks: string;
  airports: string;
  runways: string;
  roadLabel: string;
  roadLabelHalo: string;
  neighborhoodLabel: string;
  neighborhoodLabelHalo: string;
  cityLabel: string;
  cityLabelHalo: string;
};

const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const GRID_SOURCE_ID = "registry-grid-source";
const HEAT_LAYER_PREFIX = "registry-grid-heat-";
const INITIAL_BOUNDS_EXPANSION_FACTOR = 1.16;
const MAX_BOUNDS_EXPANSION_FACTOR = 1.9;
const BASEMAP_OPACITY_SCALE = 0.72;

const METRIC_CONFIG: Record<
  MetricId,
  {
    label: string;
    shortLabel: string;
    unit?: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  residentCount: {
    label: "Population Density",
    shortLabel: "Population Density",
    icon: Users,
  },
  jobCount: {
    label: "Workplace Density",
    shortLabel: "Workplace Density",
    icon: Briefcase,
  },
  pointDensity: {
    label: "Demand Point Density",
    shortLabel: "Demand Point Density",
    icon: MapPin,
  },
  workToHomeCommuteDistance: {
    label: "Work → Home Commute Time",
    shortLabel: "Work → Home Commute Time",
    unit: "m",
    icon: House,
  },
  homeToWorkCommuteDistance: {
    label: "Home → Work Commute Time",
    shortLabel: "Home → Work Commute Time",
    unit: "m",
    icon: Building2,
  },
};

const METRIC_SOURCE_KEYS: Record<MetricId, string> = {
  residentCount: "pop",
  jobCount: "jobs",
  pointDensity: "pointCount",
  workToHomeCommuteDistance: "workHomeCommuteMedian",
  homeToWorkCommuteDistance: "homeWorkCommuteMedian",
};

const METRIC_ORDER: MetricId[] = [
  "residentCount",
  "jobCount",
  "pointDensity",
  "workToHomeCommuteDistance",
  "homeToWorkCommuteDistance",
];

const HEAT_COLORS_BY_THEME: Record<ResolvedTheme, string[]> = {
  light: [
    "#e7f5ff",
    "#a5d8ff",
    "#74c0fc",
    "#4dabf7",
    "#339af0",
    "#1c7ed6",
    "#1756a9",
    "#0f2f5f",
    "#0a1220",
  ],
  dark: [
    "#0a1220",
    "#0f2f5f",
    "#1756a9",
    "#1c7ed6",
    "#339af0",
    "#4dabf7",
    "#74c0fc",
    "#a5d8ff",
    "#e7f5ff",
  ],
};

const THEME_COLORS: Record<ResolvedTheme, SubwayThemeColors> = {
  light: {
    roads: "#DCDCDC",
    buildings: "#DDDDDD",
    water: "#9FC9EA",
    background: "#F2E7D3",
    parks: "#A9D8B6",
    airports: "#F0F1F5",
    runways: "#DFE2E7",
    roadLabel: "#807F7A",
    roadLabelHalo: "#FFFFFF",
    neighborhoodLabel: "#9CA3AF",
    neighborhoodLabelHalo: "#FFFFFF",
    cityLabel: "#5D6066",
    cityLabelHalo: "#FFFFFF",
  },
  dark: {
    roads: "#3d4250",
    buildings: "#2a3040",
    water: "#0d1722",
    background: "#05070d",
    parks: "#111720",
    airports: "#141a24",
    runways: "#1f2733",
    roadLabel: "#5a6272",
    roadLabelHalo: "#0a0d15",
    neighborhoodLabel: "#687284",
    neighborhoodLabelHalo: "#0a0d15",
    cityLabel: "#8e98ac",
    cityLabelHalo: "#0a0d15",
  },
};

function isMapTheme(value: string | undefined): value is ResolvedTheme {
  return value === "light" || value === "dark";
}

function shouldRemoveOverlayLayer(layerId: string): boolean {
  return (
    layerId === "natural_earth" ||
    layerId.includes("graticule") ||
    layerId.includes("equator") ||
    layerId.includes("tropic") ||
    layerId.includes("latitude") ||
    layerId.includes("longitude")
  );
}

function isRoadLayer(layerId: string): boolean {
  return (
    layerId.includes("road") ||
    layerId.includes("street") ||
    layerId.includes("highway") ||
    layerId.includes("motorway") ||
    layerId.includes("bridge_") ||
    layerId.includes("tunnel_")
  );
}

function labelStyleForLayer(layerId: string, palette: SubwayThemeColors) {
  if (layerId.includes("highway-name") || layerId.includes("road_shield")) {
    return { text: palette.roadLabel, halo: palette.roadLabelHalo };
  }

  if (layerId.includes("city") || layerId.includes("country") || layerId.includes("state")) {
    return { text: palette.cityLabel, halo: palette.cityLabelHalo };
  }

  return {
    text: palette.neighborhoodLabel,
    halo: palette.neighborhoodLabelHalo,
  };
}

function scaledOpacity(value: unknown, scale: number) {
  if (typeof value === "number") {
    return Math.max(0, Math.min(1, value * scale));
  }
  return scale;
}

async function buildThemedStyle(theme: ResolvedTheme): Promise<StyleSpecification> {
  const styleResponse = await fetch(BASE_STYLE_URL);
  if (!styleResponse.ok) {
    throw new Error(`Failed to fetch base map style (${styleResponse.status})`);
  }

  const baseStyle = (await styleResponse.json()) as StyleSpecification;
  const baseLayers = (baseStyle.layers ?? []) as Array<Record<string, unknown>>;
  const palette = THEME_COLORS[theme];

  const themedLayers = baseLayers
    .filter((layer) => {
      const layerId = String(layer.id ?? "").toLowerCase();
      if (shouldRemoveOverlayLayer(layerId)) return false;

      if (String(layer.type ?? "") === "symbol") {
        const layout = layer.layout as Record<string, unknown> | undefined;
        const hasText = Boolean(layout?.["text-field"]);
        const hasIcon = Boolean(layout?.["icon-image"]);
        if (!hasText || hasIcon || layerId.includes("shield")) return false;
      }

      return true;
    })
    .map((layer) => {
      const nextLayer: Record<string, unknown> = { ...layer };
      const originalLayout = layer.layout as Record<string, unknown> | undefined;
      const originalPaint = layer.paint as Record<string, unknown> | undefined;
      if (originalLayout) nextLayer.layout = { ...originalLayout };
      if (originalPaint) nextLayer.paint = { ...originalPaint };

      const layerId = String(layer.id ?? "").toLowerCase();
      const layerType = String(layer.type ?? "");
      const layout = nextLayer.layout as Record<string, unknown> | undefined;
      const paint = nextLayer.paint as Record<string, unknown> | undefined;

      if (layerType === "symbol" && layout?.["text-field"]) {
        layout["text-field"] = [
          "coalesce",
          ["get", "name_en"],
          ["get", "name:en"],
          ["get", "name_int"],
          ["get", "name"],
        ];
      }

      if (!paint) return nextLayer;

      if (layerType === "background") {
        paint["background-color"] = palette.background;
        paint["background-opacity"] = scaledOpacity(
          paint["background-opacity"],
          BASEMAP_OPACITY_SCALE,
        );
      }

      if (layerType === "fill") {
        if ("fill-pattern" in paint) delete paint["fill-pattern"];
        paint["fill-opacity"] = scaledOpacity(paint["fill-opacity"], BASEMAP_OPACITY_SCALE);

        if (layerId.includes("water")) {
          paint["fill-color"] = palette.water;
          paint["fill-outline-color"] = palette.water;
        } else if (layerId.includes("ice")) {
          paint["fill-color"] = palette.buildings;
          paint["fill-outline-color"] = palette.buildings;
        } else if (layerId === "building" || layerId.includes("building-3d")) {
          paint["fill-color"] = palette.buildings;
          paint["fill-outline-color"] = palette.buildings;
        } else if (layerId.includes("aeroway")) {
          const value = layerId.includes("runway") ? palette.runways : palette.airports;
          paint["fill-color"] = value;
          paint["fill-outline-color"] = value;
        } else if (
          layerId.includes("park") ||
          layerId.includes("green") ||
          layerId.includes("landcover_wood") ||
          layerId.includes("landcover_grass") ||
          layerId.includes("landcover_wetland")
        ) {
          paint["fill-color"] = palette.parks;
          paint["fill-outline-color"] = palette.parks;
        } else if (
          layerId.includes("natural_earth") ||
          layerId.includes("landuse") ||
          layerId.includes("landcover")
        ) {
          paint["fill-color"] = palette.background;
          paint["fill-outline-color"] = palette.background;
        }
      }

      if (layerType === "line") {
        paint["line-opacity"] = scaledOpacity(paint["line-opacity"], BASEMAP_OPACITY_SCALE);

        if (layerId.includes("water")) {
          paint["line-color"] = palette.water;
        } else if (layerId === "park_outline") {
          paint["line-color"] = palette.parks;
          paint["line-opacity"] = 0.25;
        } else if (layerId.includes("aeroway_runway") || layerId.includes("aeroway_taxiway")) {
          paint["line-color"] = palette.runways;
        } else if (layerId.includes("aeroway")) {
          paint["line-color"] = palette.airports;
        } else if (isRoadLayer(layerId)) {
          paint["line-color"] = palette.roads;
        } else if (layerId.includes("boundary")) {
          paint["line-color"] = palette.neighborhoodLabel;
        }
      }

      if (layerType === "symbol") {
        const labelStyle = labelStyleForLayer(layerId, palette);
        paint["text-color"] = labelStyle.text;
        paint["text-halo-color"] = labelStyle.halo;
        paint["text-halo-width"] = 1.8;
      }

      return nextLayer;
    });

  return {
    ...baseStyle,
    layers: themedLayers as StyleSpecification["layers"],
  };
}

function compactNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);
}

function formatMetricValue(metricId: MetricId, value: number) {
  if (metricId === "residentCount" || metricId === "jobCount" || metricId === "pointDensity") {
    if (value >= 1000) return compactNumber(value);
    return Math.round(value).toLocaleString("en-US");
  }
  const unit = METRIC_CONFIG[metricId].unit;
  if (unit === "m") {
    const kilometers = value / 1000;
    const rounded = Number(kilometers >= 100 ? kilometers.toFixed(0) : kilometers.toFixed(1));
    return `${rounded} km`;
  }
  const formatted = value >= 1000 ? compactNumber(value) : value.toFixed(1);
  return unit ? `${formatted} ${unit}` : formatted;
}

function readNumericProperty(properties: Record<string, unknown>, key: string): number {
  const raw = properties[key];
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCoord(value: number | null) {
  if (!Number.isFinite(value ?? Number.NaN)) return "-";
  return Number(value).toFixed(4);
}

function expandBboxByFactor(bbox: Bbox, factor: number): Bbox {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const halfLng = ((maxLng - minLng) / 2) * factor;
  const halfLat = ((maxLat - minLat) / 2) * factor;
  return [centerLng - halfLng, centerLat - halfLat, centerLng + halfLng, centerLat + halfLat];
}

function extractCoordinates(node: unknown, into: Array<[number, number]>) {
  if (!node || !Array.isArray(node)) return;

  if (node.length >= 2 && typeof node[0] === "number" && typeof node[1] === "number") {
    into.push([node[0], node[1]]);
    return;
  }

  for (const child of node) {
    extractCoordinates(child, into);
  }
}

function geometryBbox(geometry: { coordinates: unknown } | null | undefined): Bbox | null {
  const coords: Array<[number, number]> = [];
  extractCoordinates(geometry?.coordinates, coords);
  if (coords.length === 0) return null;

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const [lng, lat] of coords) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  if (
    !Number.isFinite(minLng) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLng) ||
    !Number.isFinite(maxLat)
  ) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat];
}

function mergeBbox(left: Bbox | null, right: Bbox | null): Bbox | null {
  if (!left) return right;
  if (!right) return left;
  return [
    Math.min(left[0], right[0]),
    Math.min(left[1], right[1]),
    Math.max(left[2], right[2]),
    Math.max(left[3], right[3]),
  ];
}

function centroidFromBbox(bbox: Bbox | null) {
  if (!bbox) return null;
  return {
    lng: (bbox[0] + bbox[2]) / 2,
    lat: (bbox[1] + bbox[3]) / 2,
  };
}

function numericValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentile(sortedValues: number[], p: number) {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0] ?? 0;
  const position = (sortedValues.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower] ?? 0;
  const lowerValue = sortedValues[lower] ?? 0;
  const upperValue = sortedValues[upper] ?? lowerValue;
  const weight = position - lower;
  return lowerValue * (1 - weight) + upperValue * weight;
}

function buildMetricStats(features: GridFeature[]) {
  const result = {} as GridSnapshot["metrics"];

  for (const metricId of METRIC_ORDER) {
    const values = features
      .map((feature) => feature.properties[metricId])
      .filter((value) => value > 0);
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted.length > 0 ? (sorted[0] ?? 0) : 0;
    const max = sorted.length > 0 ? (sorted[sorted.length - 1] ?? 0) : 0;
    const p95 = percentile(sorted, 0.95);
    const p98 = percentile(sorted, 0.98);

    result[metricId] = {
      min,
      max,
      p95,
      p98,
      recommendedMax: p98 > 0 ? p98 : max,
      nonZeroCount: sorted.length,
    };
  }

  return result;
}

function normalizeFeature(feature: unknown): GridFeature | null {
  const candidate = feature as {
    geometry?: {
      type?: string;
      coordinates?: unknown;
    };
    properties?: Record<string, unknown>;
  };

  const geometry = candidate?.geometry;
  if (!geometry || geometry.coordinates === undefined) return null;
  const type = geometry?.type;
  if (type !== "Polygon" && type !== "MultiPolygon") return null;

  const bbox = geometryBbox(geometry as { coordinates: unknown });
  const centroid = centroidFromBbox(bbox);
  if (!centroid) return null;

  const sourceProps = candidate?.properties ?? {};
  const properties = {
    residentCount: numericValue(sourceProps[METRIC_SOURCE_KEYS.residentCount]),
    jobCount: numericValue(sourceProps[METRIC_SOURCE_KEYS.jobCount]),
    pointDensity: numericValue(sourceProps[METRIC_SOURCE_KEYS.pointDensity]),
    workToHomeCommuteDistance: numericValue(
      sourceProps[METRIC_SOURCE_KEYS.workToHomeCommuteDistance],
    ),
    homeToWorkCommuteDistance: numericValue(
      sourceProps[METRIC_SOURCE_KEYS.homeToWorkCommuteDistance],
    ),
    centroidLng: centroid.lng,
    centroidLat: centroid.lat,
  };

  return {
    type: "Feature",
    geometry: {
      type,
      coordinates: geometry.coordinates,
    },
    properties,
  };
}

function normalizeMapGrid(mapId: string, grid: unknown): GridSnapshot {
  const sourceFeatures = Array.isArray((grid as { features?: unknown[] })?.features)
    ? ((grid as { features: unknown[] }).features ?? [])
    : [];

  const features = sourceFeatures
    .map((feature) => normalizeFeature(feature))
    .filter((feature): feature is GridFeature => feature !== null);

  if (features.length === 0) {
    throw new Error(`No usable grid features for ${mapId}`);
  }

  const bbox = features.reduce<Bbox | null>(
    (current, feature) => mergeBbox(current, geometryBbox(feature.geometry)),
    null,
  );

  if (!bbox) {
    throw new Error(`No bbox could be computed for ${mapId}`);
  }

  return {
    mapId,
    bbox,
    featureCount: features.length,
    metrics: buildMetricStats(features),
    geojson: {
      type: "FeatureCollection",
      features,
    },
  };
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
        const response = await fetch(`/registry/maps/${encodeURIComponent(mapId)}/grid.geojson`, {
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
      <div className="flex h-[26rem] items-center justify-center rounded-xl border border-border/65 bg-muted/25 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="flex h-[26rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
        <MapPin className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden={true} />
        <p className="text-sm text-muted-foreground">Heatmap grid data is not available.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-[26rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
        <AlertCircle className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden={true} />
        <p className="text-sm text-muted-foreground">Unable to load map heatmap data right now.</p>
      </div>
    );
  }

  return (
    <div className="registry-map-tab space-y-3">
      <MapViewIndicator
        icon={ActiveMetricIcon}
        viewName={activeMetricConfig.shortLabel}
        currentPage={activeMetricIndex + 1}
        totalPages={METRIC_ORDER.length}
        onPrevious={() => setMetricByOffset(-1)}
        onNext={() => setMetricByOffset(1)}
      />

      <div className="overflow-visible rounded-xl border border-border/60 bg-card/65 p-1.5 ring-1 ring-foreground/5">
        <div className="relative h-[26rem] w-full overflow-visible rounded-lg">
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
