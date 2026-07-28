import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { MapPin, Minus, Plus } from "lucide-react";
import { getSuiteById } from "@/config/site-navigation";
import { navigate } from "@/lib/router";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { RegistryItemCard } from "@/shared/registry-card/registry-item-card";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import { MapAttribution } from "@/features/registry/components/shared/map-attribution";
import { toRegistryCardData } from "@/features/registry/lib/registry-card-data";
import { compareByLastUpdatedDesc } from "@/features/registry/lib/sort-registry-items";
import {
  buildThemedStyle,
  loadMaplibre,
  resolveMapTheme,
  type ResolvedTheme,
} from "@/features/registry/lib/themed-map-style";
import type {
  RawRegistryManifest,
  RegistrySearchItem,
} from "@/features/registry/lib/registry-search-types";

type MapPoint = {
  id: string;
  item: RegistrySearchItem;
  coordinates: [number, number];
};

type ClusterGroup = {
  id: string;
  items: RegistrySearchItem[];
  itemIds: string[];
  representativeId: string;
  anchor: [number, number];
};

type ClusterAssignment = {
  clusterSize: number;
  items: RegistrySearchItem[];
  representativeId: string;
  anchor: [number, number];
};

type RenderMarker = {
  id: string;
  item: RegistrySearchItem;
  x: number;
  y: number;
  items: RegistrySearchItem[];
  clusterSize: number;
  isRepresentative: boolean;
  /** Longitude offset (deg) of the wrapped world copy this marker is drawn on. */
  worldOffset: number;
};

const CLUSTER_DISTANCE_PX = 96;
// Cluster tiers from coarse to fine. Tier N collapses markers into the stacks
// computed at its referenceZoom; zooming past splitZoom advances to the next
// tier, with individual markers beyond the last. joinZoom sits below splitZoom
// so each boundary has a hysteresis band and does not flicker at the threshold.
const CLUSTER_TIERS = [
  { referenceZoom: 2.4, splitZoom: 3.5, joinZoom: 3.05 },
  { referenceZoom: 4, splitZoom: 5.15, joinZoom: 4.7 },
];
const INDIVIDUAL_TIER = CLUSTER_TIERS.length;

function resolveClusterTier(currentTier: number, zoom: number): number {
  let tier = currentTier;
  while (tier < INDIVIDUAL_TIER && zoom >= CLUSTER_TIERS[tier].splitZoom) tier += 1;
  while (tier > 0 && zoom <= CLUSTER_TIERS[tier - 1].joinZoom) tier -= 1;
  return tier;
}

const HOVER_HIDE_DELAY_MS = 180;
const HOVER_CARD_MARGIN_PX = 12;
const HOVER_CARD_GAP_PX = 14;
const MARKER_SIZE_PX = 32;
// With renderWorldCopies, markers must be drawn on every visible world copy;
// at minZoom 1.7 at most one wrapped copy can enter the viewport on each side.
const WORLD_COPY_OFFSETS = [-360, 0, 360];

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildMarkerAnimation(modePulse: boolean): CSSProperties | undefined {
  if (!modePulse) return undefined;

  return {
    animation: "marker-split-join 240ms cubic-bezier(0.22, 0.9, 0.35, 1)",
  };
}

function markersOverlap(a: RenderMarker, b: RenderMarker, padding = 4): boolean {
  const aLeft = a.x - MARKER_SIZE_PX / 2;
  const aRight = a.x + MARKER_SIZE_PX / 2;
  const aTop = a.y - MARKER_SIZE_PX;
  const aBottom = a.y;

  const bLeft = b.x - MARKER_SIZE_PX / 2;
  const bRight = b.x + MARKER_SIZE_PX / 2;
  const bTop = b.y - MARKER_SIZE_PX;
  const bBottom = b.y;

  return !(
    aRight + padding < bLeft ||
    bRight + padding < aLeft ||
    aBottom + padding < bTop ||
    bBottom + padding < aTop
  );
}

function mergeOverlappingMarkers(markers: RenderMarker[]): RenderMarker[] {
  const groups = markers.map((marker) => ({
    x: marker.x,
    y: marker.y,
    items: [...marker.items],
    worldOffset: marker.worldOffset,
  }));

  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < groups.length; i += 1) {
      for (let j = i + 1; j < groups.length; j += 1) {
        const probeA: RenderMarker = {
          id: "",
          item: groups[i].items[0],
          x: groups[i].x,
          y: groups[i].y,
          items: groups[i].items,
          clusterSize: groups[i].items.length,
          isRepresentative: true,
          worldOffset: groups[i].worldOffset,
        };
        const probeB: RenderMarker = {
          id: "",
          item: groups[j].items[0],
          x: groups[j].x,
          y: groups[j].y,
          items: groups[j].items,
          clusterSize: groups[j].items.length,
          isRepresentative: true,
          worldOffset: groups[j].worldOffset,
        };

        if (!markersOverlap(probeA, probeB)) continue;

        const mergedItems = [...groups[i].items, ...groups[j].items];
        const mergedCount = mergedItems.length;
        groups[i] = {
          x:
            (groups[i].x * groups[i].items.length + groups[j].x * groups[j].items.length) /
            mergedCount,
          y:
            (groups[i].y * groups[i].items.length + groups[j].y * groups[j].items.length) /
            mergedCount,
          items: mergedItems,
          worldOffset: groups[i].worldOffset,
        };
        groups.splice(j, 1);
        changed = true;
        break outer;
      }
    }
  }

  return groups.map((group) => {
    const byId = new Map<string, RegistrySearchItem>();
    for (const item of group.items) {
      byId.set(item.id, item);
    }
    const uniqueItems = [...byId.values()].sort(compareByLastUpdatedDesc);
    const clusterSize = uniqueItems.length;
    const clusterId = `${uniqueItems.map((item) => item.id).join("|")}@${group.worldOffset}`;

    return {
      id: clusterId,
      item: uniqueItems[0],
      x: group.x,
      y: group.y,
      items: uniqueItems,
      clusterSize,
      isRepresentative: true,
      worldOffset: group.worldOffset,
    };
  });
}

function getMapCoordinates(item: RegistrySearchItem): [number, number] | null {
  const manifest = item.manifest as RawRegistryManifest | null | undefined;
  const viewState = manifest?.initial_view_state;
  if (!viewState) return null;

  const latitude = Number(viewState.latitude);
  const longitude = Number(viewState.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return [longitude, latitude];
}

function lngLatToWorldPoint(lng: number, lat: number, zoom: number): { x: number; y: number } {
  const tileSize = 512;
  const scale = tileSize * 2 ** zoom;
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const x = ((lng + 180) / 360) * scale;
  const sin = Math.sin((clampedLat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function getClusterAnchor(members: MapPoint[]): [number, number] {
  const sum = members.reduce(
    (acc, member) => {
      acc.lng += member.coordinates[0];
      acc.lat += member.coordinates[1];
      return acc;
    },
    { lng: 0, lat: 0 },
  );
  return [sum.lng / members.length, sum.lat / members.length];
}

function buildStaticClusters(
  points: MapPoint[],
  distanceThresholdPx: number,
  referenceZoom: number,
): ClusterGroup[] {
  const screenPoints = points.map((point) => {
    const projected = lngLatToWorldPoint(point.coordinates[0], point.coordinates[1], referenceZoom);
    return { point, x: projected.x, y: projected.y };
  });

  const working: Array<{ x: number; y: number; members: MapPoint[] }> = [];

  for (const candidate of screenPoints) {
    let target: { x: number; y: number; members: MapPoint[] } | null = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const cluster of working) {
      const distance = Math.hypot(candidate.x - cluster.x, candidate.y - cluster.y);
      if (distance <= distanceThresholdPx && distance < minDistance) {
        target = cluster;
        minDistance = distance;
      }
    }

    if (!target) {
      working.push({
        x: candidate.x,
        y: candidate.y,
        members: [candidate.point],
      });
      continue;
    }

    target.members.push(candidate.point);
    const count = target.members.length;
    target.x = (target.x * (count - 1) + candidate.x) / count;
    target.y = (target.y * (count - 1) + candidate.y) / count;
  }

  return working.map((cluster) => {
    const sortedPoints = [...cluster.members].sort((a, b) =>
      compareByLastUpdatedDesc(a.item, b.item),
    );
    const itemIds = sortedPoints.map((member) => member.id);
    return {
      id: itemIds.join("|"),
      items: sortedPoints.map((member) => member.item),
      itemIds,
      representativeId: sortedPoints[0].id,
      anchor: getClusterAnchor(sortedPoints),
    };
  });
}

function MarkerBox({ clusterSize, animate }: { clusterSize: number; animate: boolean }) {
  const isCluster = clusterSize > 1;
  const markerAnimationStyle = buildMarkerAnimation(animate);

  if (isCluster) {
    return (
      <span
        className="relative inline-flex items-center justify-center rounded-md border border-[var(--suite-secondary-light)] bg-[var(--suite-secondary-light)] text-[var(--suite-text-light)] shadow-sm dark:border-[var(--suite-secondary-dark)] dark:bg-[var(--suite-secondary-dark)] dark:text-[var(--suite-text-dark)]"
        style={{
          width: MARKER_SIZE_PX,
          height: MARKER_SIZE_PX,
          ...markerAnimationStyle,
        }}
        aria-hidden="true"
      >
        <MapPin className="size-4" strokeWidth={2.2} />
        <sup className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-[var(--suite-accent-light)] px-1 text-[11px] font-black leading-none text-[var(--suite-text-inverted-light)] shadow-[0_0_0_1px_rgba(0,0,0,0.28)] dark:border-background dark:bg-[var(--suite-accent-dark)] dark:text-[var(--suite-text-inverted-dark)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.22)]">
          {clusterSize}
        </sup>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center text-[var(--suite-accent-light)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)] dark:text-[var(--suite-accent-dark)]"
      style={{
        width: MARKER_SIZE_PX,
        height: MARKER_SIZE_PX,
        ...markerAnimationStyle,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      <MapPin className="size-5" strokeWidth={2.25} />
    </span>
  );
}

export function WorldMap({ items }: { items: RegistrySearchItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const hoverHideTimerRef = useRef<number | null>(null);
  const recomputeRafRef = useRef<number | null>(null);
  const thresholdAnimTimerRef = useRef<number | null>(null);
  const clusterTierRef = useRef(0);

  const { resolvedTheme } = useThemeMode();
  const mapTheme: ResolvedTheme = resolveMapTheme(resolvedTheme, "light");

  const mapTypeConfig = getRegistryTypeConfigOrDefault("maps");
  const registryAccent = getSuiteById("registry").accent;

  const [mapReady, setMapReady] = useState(false);
  const [renderMarkers, setRenderMarkers] = useState<RenderMarker[]>([]);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [modePulse, setModePulse] = useState(false);
  const [mapViewport, setMapViewport] = useState({ width: 0, height: 0 });

  const mapPoints = useMemo(
    () =>
      items
        .map((item) => ({ item, coordinates: getMapCoordinates(item) }))
        .filter(
          (entry): entry is { item: RegistrySearchItem; coordinates: [number, number] } =>
            entry.coordinates !== null,
        )
        .map((entry) => ({
          id: entry.item.id,
          item: entry.item,
          coordinates: entry.coordinates,
        })),
    [items],
  );

  const tierClusters = useMemo(
    () =>
      CLUSTER_TIERS.map((tier) =>
        buildStaticClusters(mapPoints, CLUSTER_DISTANCE_PX, tier.referenceZoom),
      ),
    [mapPoints],
  );

  const tierAssignments = useMemo(
    () =>
      tierClusters.map((clusters) => {
        const byItemId = new Map<string, ClusterAssignment>();
        for (const cluster of clusters) {
          for (const itemId of cluster.itemIds) {
            byItemId.set(itemId, {
              clusterSize: cluster.itemIds.length,
              items: cluster.items,
              representativeId: cluster.representativeId,
              anchor: cluster.anchor,
            });
          }
        }
        return byItemId;
      }),
    [tierClusters],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let map: MaplibreMap | null = null;
    let disposed = false;
    let handleLoad: (() => void) | null = null;

    void (async () => {
      try {
        const maplibregl = await loadMaplibre();
        const style = await buildThemedStyle(mapTheme);
        if (disposed || !containerRef.current) return;

        map = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: [0, 20],
          zoom: 1.7,
          minZoom: 1.7,
          maxZoom: 18,
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          renderWorldCopies: true,
        });

        // Keep pan/drag gestures available across pointer, touch, and keyboard environments.
        map.dragPan.enable();
        map.touchZoomRotate.enable();
        map.touchZoomRotate.disableRotation();
        map.scrollZoom.enable();
        map.doubleClickZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();

        mapRef.current = map;

        handleLoad = () => {
          if (disposed) return;
          setMapReady(true);
          const initialZoom = Number(map?.getZoom());
          if (Number.isFinite(initialZoom)) {
            clusterTierRef.current = resolveClusterTier(0, initialZoom);
          }
        };
        map.on("load", handleLoad);
        if (map.isStyleLoaded()) handleLoad();
      } catch (error) {
        console.error("Failed to initialize MapLibre world map:", error);
      }
    })();

    return () => {
      disposed = true;
      setMapReady(false);
      setRenderMarkers([]);
      setHoveredMarkerId(null);
      setHoverIndex(0);
      if (hoverHideTimerRef.current !== null) {
        window.clearTimeout(hoverHideTimerRef.current);
        hoverHideTimerRef.current = null;
      }
      if (recomputeRafRef.current !== null) {
        window.cancelAnimationFrame(recomputeRafRef.current);
        recomputeRafRef.current = null;
      }
      if (thresholdAnimTimerRef.current !== null) {
        window.clearTimeout(thresholdAnimTimerRef.current);
        thresholdAnimTimerRef.current = null;
      }
      if (map && handleLoad) map.off("load", handleLoad);
      mapRef.current = null;
      map?.remove();
    };
  }, [mapTheme]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!mapReady || !map || !container) return;

    const recomputeMarkers = () => {
      recomputeRafRef.current = null;
      const currentZoom = Number(map.getZoom());
      const safeZoom = Number.isFinite(currentZoom) ? currentZoom : 1.7;

      const nextTier = resolveClusterTier(clusterTierRef.current, safeZoom);

      if (nextTier !== clusterTierRef.current) {
        clusterTierRef.current = nextTier;
        setModePulse(true);
        if (thresholdAnimTimerRef.current !== null) {
          window.clearTimeout(thresholdAnimTimerRef.current);
        }
        thresholdAnimTimerRef.current = window.setTimeout(() => {
          setModePulse(false);
          thresholdAnimTimerRef.current = null;
        }, 230);
      }
      const width = container.clientWidth;
      const height = container.clientHeight;
      const margin = 48;
      setMapViewport((previous) => {
        if (previous.width === width && previous.height === height) return previous;
        return { width, height };
      });

      const nextMarkers: RenderMarker[] = [];
      const assignments = nextTier < INDIVIDUAL_TIER ? tierAssignments[nextTier] : null;

      for (const point of mapPoints) {
        const assignment = assignments?.get(point.id) ?? null;
        if (assignments && !assignment) continue;

        const targetCoordinates = assignment ? assignment.anchor : point.coordinates;

        for (const worldOffset of WORLD_COPY_OFFSETS) {
          const projected = map.project([targetCoordinates[0] + worldOffset, targetCoordinates[1]]);

          if (
            projected.x < -margin ||
            projected.y < -margin ||
            projected.x > width + margin ||
            projected.y > height + margin
          ) {
            continue;
          }

          nextMarkers.push({
            id: `${point.id}@${worldOffset}`,
            item: point.item,
            x: projected.x,
            y: projected.y,
            items: assignment ? assignment.items : [point.item],
            clusterSize: assignment ? assignment.clusterSize : 1,
            isRepresentative: assignment ? assignment.representativeId === point.id : true,
            worldOffset,
          });
        }
      }

      setRenderMarkers(nextMarkers);
    };

    const scheduleRecompute = () => {
      if (recomputeRafRef.current !== null) return;
      recomputeRafRef.current = window.requestAnimationFrame(recomputeMarkers);
    };

    scheduleRecompute();
    map.on("render", scheduleRecompute);
    map.on("move", scheduleRecompute);
    map.on("zoom", scheduleRecompute);
    map.on("resize", scheduleRecompute);

    return () => {
      if (recomputeRafRef.current !== null) {
        window.cancelAnimationFrame(recomputeRafRef.current);
        recomputeRafRef.current = null;
      }
      if (thresholdAnimTimerRef.current !== null) {
        window.clearTimeout(thresholdAnimTimerRef.current);
        thresholdAnimTimerRef.current = null;
      }
      map.off("render", scheduleRecompute);
      map.off("move", scheduleRecompute);
      map.off("zoom", scheduleRecompute);
      map.off("resize", scheduleRecompute);
    };
  }, [mapPoints, mapReady, tierAssignments]);

  const displayMarkers = useMemo(() => {
    const visibleMarkers = renderMarkers.filter((marker) => marker.isRepresentative);
    return mergeOverlappingMarkers(visibleMarkers);
  }, [renderMarkers]);

  const hoveredMarker = useMemo(
    () => displayMarkers.find((marker) => marker.id === hoveredMarkerId) ?? null,
    [displayMarkers, hoveredMarkerId],
  );

  const hoveredItems = hoveredMarker?.items ?? [];
  const hoveredItem =
    hoveredItems.length > 0
      ? hoveredItems[
          ((hoverIndex % hoveredItems.length) + hoveredItems.length) % hoveredItems.length
        ]
      : null;
  const dynamicHoverCardHeight = clampNumber(Math.round(mapViewport.height * 0.42), 184, 300);
  const hoverCardWidth = clampNumber(mapViewport.width - HOVER_CARD_MARGIN_PX * 2, 200, 352);
  const hoverCardPosition = useMemo(() => {
    if (!hoveredMarker) {
      return { left: HOVER_CARD_MARGIN_PX, top: HOVER_CARD_MARGIN_PX };
    }

    const markerLeft = hoveredMarker.x - MARKER_SIZE_PX / 2;
    const markerRight = hoveredMarker.x + MARKER_SIZE_PX / 2;
    const markerTop = hoveredMarker.y - MARKER_SIZE_PX;
    const markerBottom = hoveredMarker.y;

    const minLeft = HOVER_CARD_MARGIN_PX;
    const minTop = HOVER_CARD_MARGIN_PX;
    const maxLeft = Math.max(
      HOVER_CARD_MARGIN_PX,
      mapViewport.width - HOVER_CARD_MARGIN_PX - hoverCardWidth,
    );
    const maxTop = Math.max(
      HOVER_CARD_MARGIN_PX,
      mapViewport.height - HOVER_CARD_MARGIN_PX - dynamicHoverCardHeight,
    );

    const candidates = [
      {
        left: markerRight + HOVER_CARD_GAP_PX,
        top: markerTop - dynamicHoverCardHeight - HOVER_CARD_GAP_PX,
      },
      {
        left: markerRight + HOVER_CARD_GAP_PX,
        top: markerBottom + HOVER_CARD_GAP_PX,
      },
      {
        left: markerLeft - hoverCardWidth - HOVER_CARD_GAP_PX,
        top: markerTop - dynamicHoverCardHeight - HOVER_CARD_GAP_PX,
      },
      {
        left: markerLeft - hoverCardWidth - HOVER_CARD_GAP_PX,
        top: markerBottom + HOVER_CARD_GAP_PX,
      },
    ];

    const fullyVisibleCandidate = candidates.find((candidate) => {
      const right = candidate.left + hoverCardWidth;
      const bottom = candidate.top + dynamicHoverCardHeight;
      return (
        candidate.left >= minLeft &&
        candidate.top >= minTop &&
        right <= mapViewport.width - HOVER_CARD_MARGIN_PX &&
        bottom <= mapViewport.height - HOVER_CARD_MARGIN_PX
      );
    });

    if (fullyVisibleCandidate) return fullyVisibleCandidate;

    const fallback = candidates[0];
    return {
      left: clampNumber(fallback.left, minLeft, maxLeft),
      top: clampNumber(fallback.top, minTop, maxTop),
    };
  }, [
    dynamicHoverCardHeight,
    hoverCardWidth,
    hoveredMarker,
    mapViewport.height,
    mapViewport.width,
  ]);

  const clearHoverSoon = () => {
    if (hoverHideTimerRef.current !== null) {
      window.clearTimeout(hoverHideTimerRef.current);
    }

    hoverHideTimerRef.current = window.setTimeout(() => {
      setHoveredMarkerId(null);
      setHoverIndex(0);
      hoverHideTimerRef.current = null;
    }, HOVER_HIDE_DELAY_MS);
  };

  const cancelHoverHide = () => {
    if (hoverHideTimerRef.current !== null) {
      window.clearTimeout(hoverHideTimerRef.current);
      hoverHideTimerRef.current = null;
    }
  };

  return (
    <div className="registry-world-map relative h-full w-full">
      <style>{`
        @keyframes marker-split-join {
          0% {
            transform: scale(0.82);
            opacity: 0.55;
          }
          62% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .registry-world-map .maplibregl-canvas-container,
        .registry-world-map .maplibregl-canvas {
          touch-action: none;
        }

        .registry-world-map .maplibregl-canvas-container.maplibregl-interactive {
          cursor: grab;
        }

        .registry-world-map .maplibregl-canvas-container.maplibregl-interactive:active {
          cursor: grabbing;
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full rounded-none" aria-label="World map" />

      <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn({ duration: 220 })}
          className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent dark:bg-card/90 sm:size-9"
          aria-label="Zoom in"
        >
          <Plus className="size-3.5 sm:size-4" strokeWidth={2.3} />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut({ duration: 220 })}
          className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent dark:bg-card/90 sm:size-9"
          aria-label="Zoom out"
        >
          <Minus className="size-3.5 sm:size-4" strokeWidth={2.3} />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {displayMarkers.map((marker) => {
          const isHovered = hoveredMarkerId === marker.id;

          return (
            <button
              key={marker.id}
              type="button"
              className={
                modePulse
                  ? "absolute transform-gpu transition-[left,top,opacity,transform] duration-230 ease-out"
                  : "absolute transform-gpu transition-opacity duration-120 ease-out"
              }
              style={{
                left: `${marker.x}px`,
                top: `${marker.y}px`,
                transform: "translate(-50%, -100%)",
                opacity: 1,
                pointerEvents: "auto",
                zIndex: isHovered ? 2 : 1,
              }}
              onMouseEnter={() => {
                cancelHoverHide();
                setHoveredMarkerId(marker.id);
                setHoverIndex(0);
              }}
              onMouseLeave={clearHoverSoon}
              onFocus={() => {
                cancelHoverHide();
                setHoveredMarkerId(marker.id);
                setHoverIndex(0);
              }}
              onBlur={clearHoverSoon}
              onClick={() => {
                if (marker.items.length === 1) {
                  navigate(marker.items[0].href);
                }
              }}
              aria-label={
                marker.items.length === 1
                  ? `Open ${marker.items[0].name}`
                  : `Cluster of ${marker.items.length} maps`
              }
            >
              <span
                className={
                  modePulse
                    ? "scale-[0.94] opacity-90 transition-[transform,opacity] duration-200"
                    : isHovered
                      ? "scale-105 transition-transform duration-150"
                      : "scale-100 transition-transform duration-150"
                }
              >
                <MarkerBox clusterSize={marker.clusterSize} animate={modePulse} />
              </span>
            </button>
          );
        })}
      </div>

      {hoveredMarker && hoveredItem ? (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: `${hoverCardPosition.left}px`,
            top: `${hoverCardPosition.top}px`,
            width: `${hoverCardWidth}px`,
            maxHeight: `calc(100% - ${HOVER_CARD_MARGIN_PX * 2}px)`,
          }}
        >
          <div
            className="pointer-events-auto h-full overflow-auto rounded-xl border border-border/60 bg-card/95 p-2 shadow-xl backdrop-blur-sm"
            onMouseEnter={cancelHoverHide}
            onMouseLeave={clearHoverSoon}
            // Clicking the marker (or tapping) moves focus into the card; the
            // marker's onBlur schedules a hide, so the card must cancel it when
            // focus lands here and only re-arm it when focus leaves entirely.
            onFocus={cancelHoverHide}
            onBlur={clearHoverSoon}
          >
            <RegistryItemCard
              data={toRegistryCardData(hoveredItem)}
              typeConfig={mapTypeConfig}
              variant="grid"
              authorHoverAccent={registryAccent}
            />
            {hoveredItems.length > 1 ? (
              <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    cancelHoverHide();
                    setHoverIndex(
                      (current) => (current - 1 + hoveredItems.length) % hoveredItems.length,
                    );
                  }}
                  className="rounded-md border border-border bg-background/70 px-2 py-1 hover:bg-accent"
                >
                  Prev
                </button>
                <span>
                  {(hoverIndex % hoveredItems.length) + 1} / {hoveredItems.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    cancelHoverHide();
                    setHoverIndex((current) => (current + 1) % hoveredItems.length);
                  }}
                  className="rounded-md border border-border bg-background/70 px-2 py-1 hover:bg-accent"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <MapAttribution linkHoverClassName="hover:text-(--suite-accent-light) dark:hover:text-(--suite-accent-dark)" />
    </div>
  );
}
