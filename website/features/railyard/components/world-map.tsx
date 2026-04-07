'use client';

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MapPin, Minus, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ItemCard } from '@/features/railyard/components/item-card';
import { useRegistry } from '@/hooks/use-registry';
import type { MapManifest } from '@/types/registry';

type MapInstance = {
  addControl: (control: unknown, position?: string) => void;
  on: (...args: unknown[]) => void;
  off: (...args: unknown[]) => void;
  getZoom?: () => number;
  zoomIn?: (options?: { duration?: number }) => void;
  zoomOut?: (options?: { duration?: number }) => void;
  dragPan?: { enable?: () => void; disable?: () => void };
  touchZoomRotate?: {
    enable?: () => void;
    disable?: () => void;
    disableRotation?: () => void;
  };
  scrollZoom?: { enable?: () => void; disable?: () => void };
  doubleClickZoom?: { enable?: () => void; disable?: () => void };
  boxZoom?: { enable?: () => void; disable?: () => void };
  keyboard?: { enable?: () => void; disable?: () => void };
  project: (lngLat: [number, number]) => { x: number; y: number };
  isStyleLoaded?: () => boolean;
  remove: () => void;
};

type MapLibreGlobal = {
  Map: new (options: Record<string, unknown>) => MapInstance;
  NavigationControl: new (options?: Record<string, unknown>) => unknown;
};

type MapStyle = {
  version: number;
  glyphs?: string;
  sprite?: string;
  sources: Record<string, unknown>;
  layers: Array<Record<string, unknown>>;
};

type ResolvedTheme = 'light' | 'dark';

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

type MapPoint = {
  id: string;
  map: MapManifest;
  coordinates: [number, number];
};

type ClusterGroup = {
  id: string;
  maps: MapManifest[];
  mapIds: string[];
  representativeId: string;
  anchor: [number, number];
};

type ClusterAssignment = {
  clusterSize: number;
  maps: MapManifest[];
  representativeId: string;
  anchor: [number, number];
};

type RenderMarker = {
  id: string;
  map: MapManifest;
  x: number;
  y: number;
  maps: MapManifest[];
  clusterSize: number;
  isRepresentative: boolean;
};

declare global {
  interface Window {
    maplibregl?: MapLibreGlobal;
  }
}

const MAPLIBRE_SCRIPT_SRC =
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
const MAPLIBRE_SCRIPT_ID = 'maplibre-gl-script';
const BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const CLUSTER_DISTANCE_PX = 96;
const CLUSTER_REFERENCE_ZOOM = 2.4;
const CLUSTER_SPLIT_ZOOM = 5.15;
const CLUSTER_JOIN_ZOOM = 4.7;
const HOVER_HIDE_DELAY_MS = 180;
const HOVER_CARD_MARGIN_PX = 12;
const HOVER_CARD_GAP_PX = 14;

const THEME_COLORS: Record<ResolvedTheme, SubwayThemeColors> = {
  light: {
    roads: '#DCDCDC',
    buildings: '#DDDDDD',
    water: '#9FC9EA',
    background: '#F2E7D3',
    parks: '#A9D8B6',
    airports: '#F0F1F5',
    runways: '#DFE2E7',
    roadLabel: '#807F7A',
    roadLabelHalo: '#FFFFFF',
    neighborhoodLabel: '#9CA3AF',
    neighborhoodLabelHalo: '#FFFFFF',
    cityLabel: '#5D6066',
    cityLabelHalo: '#FFFFFF',
  },
  dark: {
    roads: '#4A4A4A',
    buildings: '#454957',
    water: '#062036',
    background: '#0F1A24',
    parks: '#0B1715',
    airports: '#181C28',
    runways: '#242938',
    roadLabel: '#6E6E6E',
    roadLabelHalo: '#000000',
    neighborhoodLabel: '#6B7280',
    neighborhoodLabelHalo: '#000000',
    cityLabel: '#AFB3BA',
    cityLabelHalo: '#000000',
  },
};

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getMarkerSizePx(): number {
  return 32;
}

function buildMarkerAnimation(modePulse: boolean): CSSProperties | undefined {
  if (!modePulse) return undefined;

  return {
    animation: 'marker-split-join 240ms cubic-bezier(0.22, 0.9, 0.35, 1)',
  };
}

function markersOverlap(
  a: RenderMarker,
  b: RenderMarker,
  padding = 4,
): boolean {
  const aSize = getMarkerSizePx();
  const bSize = getMarkerSizePx();

  const aLeft = a.x - aSize / 2;
  const aRight = a.x + aSize / 2;
  const aTop = a.y - aSize;
  const aBottom = a.y;

  const bLeft = b.x - bSize / 2;
  const bRight = b.x + bSize / 2;
  const bTop = b.y - bSize;
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
    maps: [...marker.maps],
  }));

  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < groups.length; i += 1) {
      for (let j = i + 1; j < groups.length; j += 1) {
        const probeA: RenderMarker = {
          id: '',
          map: groups[i].maps[0],
          x: groups[i].x,
          y: groups[i].y,
          maps: groups[i].maps,
          clusterSize: groups[i].maps.length,
          isRepresentative: true,
        };
        const probeB: RenderMarker = {
          id: '',
          map: groups[j].maps[0],
          x: groups[j].x,
          y: groups[j].y,
          maps: groups[j].maps,
          clusterSize: groups[j].maps.length,
          isRepresentative: true,
        };

        if (!markersOverlap(probeA, probeB)) continue;

        const mergedMaps = [...groups[i].maps, ...groups[j].maps];
        const mergedCount = mergedMaps.length;
        groups[i] = {
          x:
            (groups[i].x * groups[i].maps.length +
              groups[j].x * groups[j].maps.length) /
            mergedCount,
          y:
            (groups[i].y * groups[i].maps.length +
              groups[j].y * groups[j].maps.length) /
            mergedCount,
          maps: mergedMaps,
        };
        groups.splice(j, 1);
        changed = true;
        break outer;
      }
    }
  }

  return groups.map((group) => {
    const byId = new Map<string, MapManifest>();
    for (const map of group.maps) {
      byId.set(map.id, map);
    }
    const uniqueMaps = [...byId.values()].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    const clusterSize = uniqueMaps.length;
    const clusterId = uniqueMaps.map((map) => map.id).join('|');

    return {
      id: clusterId,
      map: uniqueMaps[0],
      x: group.x,
      y: group.y,
      maps: uniqueMaps,
      clusterSize,
      isRepresentative: true,
    };
  });
}

function loadMapLibre(): Promise<MapLibreGlobal> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not available'));
  }

  if (window.maplibregl) return Promise.resolve(window.maplibregl);

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      MAPLIBRE_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.maplibregl) resolve(window.maplibregl);
      });
      existingScript.addEventListener('error', () =>
        reject(new Error('Failed to load MapLibre script')),
      );
      return;
    }

    const script = document.createElement('script');
    script.id = MAPLIBRE_SCRIPT_ID;
    script.src = MAPLIBRE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (!window.maplibregl) {
        reject(
          new Error('MapLibre script loaded but window.maplibregl is missing'),
        );
        return;
      }
      resolve(window.maplibregl);
    };
    script.onerror = () => reject(new Error('Failed to load MapLibre script'));
    document.head.appendChild(script);
  });
}

function isMapTheme(value: string | undefined): value is ResolvedTheme {
  return value === 'light' || value === 'dark';
}

function shouldRemoveOverlayLayer(layerId: string): boolean {
  return (
    layerId === 'natural_earth' ||
    layerId.includes('graticule') ||
    layerId.includes('equator') ||
    layerId.includes('tropic') ||
    layerId.includes('latitude') ||
    layerId.includes('longitude')
  );
}

function isRoadLayer(layerId: string): boolean {
  return (
    layerId.includes('road') ||
    layerId.includes('street') ||
    layerId.includes('highway') ||
    layerId.includes('motorway') ||
    layerId.includes('bridge_') ||
    layerId.includes('tunnel_')
  );
}

function labelStyleForLayer(layerId: string, palette: SubwayThemeColors) {
  if (layerId.includes('highway-name') || layerId.includes('road_shield')) {
    return { text: palette.roadLabel, halo: palette.roadLabelHalo };
  }

  if (
    layerId.includes('city') ||
    layerId.includes('country') ||
    layerId.includes('state')
  ) {
    return { text: palette.cityLabel, halo: palette.cityLabelHalo };
  }

  return {
    text: palette.neighborhoodLabel,
    halo: palette.neighborhoodLabelHalo,
  };
}

function getInitialViewState(map: MapManifest) {
  return map.initial_view_state ?? map.initialViewState;
}

function getMapCoordinates(map: MapManifest): [number, number] | null {
  const viewState = getInitialViewState(map);
  if (!viewState) return null;

  const latitude = Number(viewState.latitude);
  const longitude = Number(viewState.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
    return null;

  return [longitude, latitude];
}

function lngLatToWorldPoint(
  lng: number,
  lat: number,
  zoom: number,
): { x: number; y: number } {
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
    const projected = lngLatToWorldPoint(
      point.coordinates[0],
      point.coordinates[1],
      referenceZoom,
    );
    return { point, x: projected.x, y: projected.y };
  });

  const working: Array<{ x: number; y: number; members: MapPoint[] }> = [];

  for (const candidate of screenPoints) {
    let target: { x: number; y: number; members: MapPoint[] } | null = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const cluster of working) {
      const distance = Math.hypot(
        candidate.x - cluster.x,
        candidate.y - cluster.y,
      );
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
    const sortedMaps = [...cluster.members].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    const mapIds = sortedMaps.map((member) => member.id);
    return {
      id: mapIds.join('|'),
      maps: sortedMaps.map((member) => member.map),
      mapIds,
      representativeId: sortedMaps[0].id,
      anchor: getClusterAnchor(sortedMaps),
    };
  });
}

function MarkerBox({
  clusterSize,
  animate,
}: {
  clusterSize: number;
  animate: boolean;
}) {
  const isCluster = clusterSize > 1;
  const markerSize = getMarkerSizePx();
  const markerAnimationStyle = buildMarkerAnimation(animate);

  if (isCluster) {
    return (
      <span
        className="relative inline-flex items-center justify-center rounded-md border border-[var(--suite-secondary-light)] bg-[var(--suite-secondary-light)] text-[var(--suite-text-light)] shadow-sm dark:border-[var(--suite-secondary-dark)] dark:bg-[var(--suite-secondary-dark)] dark:text-[var(--suite-text-dark)]"
        style={{
          width: markerSize,
          height: markerSize,
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
        width: markerSize,
        height: markerSize,
        ...markerAnimationStyle,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      <MapPin className="size-5" strokeWidth={2.25} />
    </span>
  );
}

async function buildThemedStyle(theme: ResolvedTheme): Promise<MapStyle> {
  const styleResponse = await fetch(BASE_STYLE_URL);
  if (!styleResponse.ok) {
    throw new Error(`Failed to fetch base map style (${styleResponse.status})`);
  }

  const baseStyle = (await styleResponse.json()) as MapStyle;
  const palette = THEME_COLORS[theme];

  const themedLayers = baseStyle.layers
    .filter((layer) => {
      const layerId = String(layer.id ?? '').toLowerCase();
      if (shouldRemoveOverlayLayer(layerId)) return false;

      if (String(layer.type ?? '') === 'symbol') {
        const layout = layer.layout as Record<string, unknown> | undefined;
        const hasText = Boolean(layout?.['text-field']);
        const hasIcon = Boolean(layout?.['icon-image']);
        if (!hasText || hasIcon || layerId.includes('shield')) return false;
      }

      return true;
    })
    .map((layer) => {
      const nextLayer: Record<string, unknown> = { ...layer };
      const originalLayout = layer.layout as
        | Record<string, unknown>
        | undefined;
      const originalPaint = layer.paint as Record<string, unknown> | undefined;
      if (originalLayout) nextLayer.layout = { ...originalLayout };
      if (originalPaint) nextLayer.paint = { ...originalPaint };

      const layerId = String(layer.id ?? '').toLowerCase();
      const layerType = String(layer.type ?? '');
      const layout = nextLayer.layout as Record<string, unknown> | undefined;
      const paint = nextLayer.paint as Record<string, unknown> | undefined;

      if (layerType === 'symbol' && layout?.['text-field']) {
        layout['text-field'] = [
          'coalesce',
          ['get', 'name_en'],
          ['get', 'name:en'],
          ['get', 'name_int'],
          ['get', 'name'],
        ];
      }

      if (!paint) return nextLayer;

      if (layerType === 'background') {
        paint['background-color'] = palette.background;
      }

      if (layerType === 'fill') {
        if ('fill-pattern' in paint) delete paint['fill-pattern'];

        if (layerId.includes('water')) {
          paint['fill-color'] = palette.water;
          paint['fill-outline-color'] = palette.water;
        } else if (layerId.includes('ice')) {
          paint['fill-color'] = palette.buildings;
          paint['fill-outline-color'] = palette.buildings;
        } else if (layerId === 'building' || layerId.includes('building-3d')) {
          paint['fill-color'] = palette.buildings;
          paint['fill-outline-color'] = palette.buildings;
        } else if (layerId.includes('aeroway')) {
          const value = layerId.includes('runway')
            ? palette.runways
            : palette.airports;
          paint['fill-color'] = value;
          paint['fill-outline-color'] = value;
        } else if (
          layerId.includes('park') ||
          layerId.includes('green') ||
          layerId.includes('landcover_wood') ||
          layerId.includes('landcover_grass') ||
          layerId.includes('landcover_wetland')
        ) {
          paint['fill-color'] = palette.parks;
          paint['fill-outline-color'] = palette.parks;
        } else if (
          layerId.includes('natural_earth') ||
          layerId.includes('landuse') ||
          layerId.includes('landcover')
        ) {
          paint['fill-color'] = palette.background;
          paint['fill-outline-color'] = palette.background;
        }
      }

      if (layerType === 'line') {
        if (layerId.includes('water')) {
          paint['line-color'] = palette.water;
        } else if (layerId === 'park_outline') {
          paint['line-color'] = palette.parks;
          paint['line-opacity'] = 0.25;
        } else if (
          layerId.includes('aeroway_runway') ||
          layerId.includes('aeroway_taxiway')
        ) {
          paint['line-color'] = palette.runways;
        } else if (layerId.includes('aeroway')) {
          paint['line-color'] = palette.airports;
        } else if (isRoadLayer(layerId)) {
          paint['line-color'] = palette.roads;
        } else if (layerId.includes('boundary')) {
          paint['line-color'] = palette.neighborhoodLabel;
        }
      }

      if (layerType === 'symbol') {
        const labelStyle = labelStyleForLayer(layerId, palette);
        paint['text-color'] = labelStyle.text;
        paint['text-halo-color'] = labelStyle.halo;
        paint['text-halo-width'] = 1.8;
      }

      return nextLayer;
    });

  return {
    ...baseStyle,
    layers: themedLayers,
  };
}

export function WorldMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const hoverHideTimerRef = useRef<number | null>(null);
  const recomputeRafRef = useRef<number | null>(null);
  const thresholdAnimTimerRef = useRef<number | null>(null);
  const collapsedModeRef = useRef(true);

  const { resolvedTheme } = useTheme();
  const { maps, mapDownloadTotals } = useRegistry();

  const mapTheme: ResolvedTheme = isMapTheme(resolvedTheme)
    ? resolvedTheme
    : 'light';

  const [mapReady, setMapReady] = useState(false);
  const [collapsedMode, setCollapsedMode] = useState(true);
  const [renderMarkers, setRenderMarkers] = useState<RenderMarker[]>([]);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [modePulse, setModePulse] = useState(false);
  const [mapViewport, setMapViewport] = useState({ width: 0, height: 0 });

  const mapPoints = useMemo(
    () =>
      maps
        .map((map) => ({ map, coordinates: getMapCoordinates(map) }))
        .filter(
          (
            entry,
          ): entry is { map: MapManifest; coordinates: [number, number] } =>
            entry.coordinates !== null,
        )
        .map((entry) => ({
          id: entry.map.id,
          map: entry.map,
          coordinates: entry.coordinates,
        })),
    [maps],
  );

  const staticClusters = useMemo(
    () =>
      buildStaticClusters(
        mapPoints,
        CLUSTER_DISTANCE_PX,
        CLUSTER_REFERENCE_ZOOM,
      ),
    [mapPoints],
  );

  const clusterAssignments = useMemo(() => {
    const byMapId = new Map<string, ClusterAssignment>();
    for (const cluster of staticClusters) {
      for (const mapId of cluster.mapIds) {
        byMapId.set(mapId, {
          clusterSize: cluster.mapIds.length,
          maps: cluster.maps,
          representativeId: cluster.representativeId,
          anchor: cluster.anchor,
        });
      }
    }
    return byMapId;
  }, [staticClusters]);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: MapInstance | null = null;
    let disposed = false;
    let handleLoad: (() => void) | null = null;

    void (async () => {
      try {
        const maplibregl = await loadMapLibre();
        const style = await buildThemedStyle(mapTheme);
        if (disposed || !containerRef.current) return;

        map = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: [0, 20],
          zoom: 1.2,
          minZoom: 0.6,
          maxZoom: 18,
          attributionControl: true,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          renderWorldCopies: false,
        });

        // Keep pan/drag gestures available across pointer, touch, and keyboard environments.
        map.dragPan?.enable?.();
        map.touchZoomRotate?.enable?.();
        map.touchZoomRotate?.disableRotation?.();
        map.scrollZoom?.enable?.();
        map.doubleClickZoom?.enable?.();
        map.boxZoom?.enable?.();
        map.keyboard?.enable?.();

        mapRef.current = map;

        handleLoad = () => {
          if (disposed) return;
          setMapReady(true);
          const initialZoom = Number(map?.getZoom?.());
          if (Number.isFinite(initialZoom)) {
            const initiallyCollapsed = initialZoom < CLUSTER_SPLIT_ZOOM;
            collapsedModeRef.current = initiallyCollapsed;
            setCollapsedMode(initiallyCollapsed);
          }
        };
        map.on('load', handleLoad);
        if (map.isStyleLoaded?.()) handleLoad();
      } catch (error) {
        console.error('Failed to initialize MapLibre world map:', error);
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
      if (map && handleLoad) map.off('load', handleLoad);
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
      const currentZoom = Number(map.getZoom?.());
      const safeZoom = Number.isFinite(currentZoom) ? currentZoom : 1.2;

      const nextCollapsedMode = collapsedModeRef.current
        ? safeZoom < CLUSTER_SPLIT_ZOOM
        : safeZoom <= CLUSTER_JOIN_ZOOM;

      if (nextCollapsedMode !== collapsedModeRef.current) {
        collapsedModeRef.current = nextCollapsedMode;
        setCollapsedMode(nextCollapsedMode);
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
        if (previous.width === width && previous.height === height)
          return previous;
        return { width, height };
      });

      const nextMarkers: RenderMarker[] = [];

      for (const point of mapPoints) {
        const assignment = clusterAssignments.get(point.id);
        if (!assignment) continue;

        const targetCoordinates = nextCollapsedMode
          ? assignment.anchor
          : point.coordinates;
        const projected = map.project(targetCoordinates);

        if (
          projected.x < -margin ||
          projected.y < -margin ||
          projected.x > width + margin ||
          projected.y > height + margin
        ) {
          continue;
        }

        nextMarkers.push({
          id: point.id,
          map: point.map,
          x: projected.x,
          y: projected.y,
          maps: nextCollapsedMode ? assignment.maps : [point.map],
          clusterSize: nextCollapsedMode ? assignment.clusterSize : 1,
          isRepresentative: assignment.representativeId === point.id,
        });
      }

      setRenderMarkers(nextMarkers);
    };

    const scheduleRecompute = () => {
      if (recomputeRafRef.current !== null) return;
      recomputeRafRef.current = window.requestAnimationFrame(recomputeMarkers);
    };

    scheduleRecompute();
    map.on('render', scheduleRecompute);
    map.on('move', scheduleRecompute);
    map.on('zoom', scheduleRecompute);
    map.on('resize', scheduleRecompute);

    return () => {
      if (recomputeRafRef.current !== null) {
        window.cancelAnimationFrame(recomputeRafRef.current);
        recomputeRafRef.current = null;
      }
      if (thresholdAnimTimerRef.current !== null) {
        window.clearTimeout(thresholdAnimTimerRef.current);
        thresholdAnimTimerRef.current = null;
      }
      map.off('render', scheduleRecompute);
      map.off('move', scheduleRecompute);
      map.off('zoom', scheduleRecompute);
      map.off('resize', scheduleRecompute);
    };
  }, [clusterAssignments, mapPoints, mapReady]);

  const hoveredMarker = useMemo(() => {
    const visibleMarkers = renderMarkers.filter(
      (marker) => !collapsedMode || marker.isRepresentative,
    );
    const mergedMarkers = mergeOverlappingMarkers(visibleMarkers);
    return (
      mergedMarkers.find((marker) => marker.id === hoveredMarkerId) ?? null
    );
  }, [collapsedMode, hoveredMarkerId, renderMarkers]);

  const displayMarkers = useMemo(() => {
    const visibleMarkers = renderMarkers.filter(
      (marker) => !collapsedMode || marker.isRepresentative,
    );
    return mergeOverlappingMarkers(visibleMarkers);
  }, [collapsedMode, renderMarkers]);

  const hoveredMaps = hoveredMarker?.maps ?? [];
  const hoveredMap =
    hoveredMaps.length > 0
      ? hoveredMaps[
          ((hoverIndex % hoveredMaps.length) + hoveredMaps.length) %
            hoveredMaps.length
        ]
      : null;
  const dynamicHoverCardHeight = clampNumber(
    Math.round(mapViewport.height * 0.42),
    184,
    300,
  );
  const hoverCardWidth = clampNumber(
    mapViewport.width - HOVER_CARD_MARGIN_PX * 2,
    200,
    352,
  );
  const hoverCardPosition = useMemo(() => {
    if (!hoveredMarker) {
      return { left: HOVER_CARD_MARGIN_PX, top: HOVER_CARD_MARGIN_PX };
    }

    const markerSize = getMarkerSizePx();
    const markerLeft = hoveredMarker.x - markerSize / 2;
    const markerRight = hoveredMarker.x + markerSize / 2;
    const markerTop = hoveredMarker.y - markerSize;
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
    <div className="railyard-world-map relative h-full w-full">
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

        .railyard-world-map .maplibregl-ctrl-attrib.maplibregl-compact {
          border: 1px solid color-mix(in oklab, var(--color-border) 80%, transparent);
          border-radius: 9999px;
          background: color-mix(in oklab, var(--color-card) 88%, transparent);
          color: var(--color-foreground);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(4px);
          display: inline-flex;
          align-items: center;
        }

        .railyard-world-map .maplibregl-ctrl-attrib.maplibregl-compact a {
          color: color-mix(in oklab, var(--suite-accent-light) 84%, var(--color-foreground) 16%);
        }

        .railyard-world-map .maplibregl-ctrl-attrib-button {
          order: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin-left: 6px;
          margin-right: -18px;
          vertical-align: middle;
          float: none;
          border-radius: 9999px;
          border: 1px solid color-mix(in oklab, var(--color-border) 78%, transparent);
          background-color: var(--color-background);
          color: var(--color-foreground);
          background-image: none !important;
          opacity: 1;
          -webkit-tap-highlight-color: transparent;
          outline: none !important;
          box-shadow: none !important;
          position: relative;
        }

        .railyard-world-map .maplibregl-ctrl-attrib-button::before {
          content: "i";
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: var(--color-foreground);
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
        }

        .railyard-world-map .maplibregl-ctrl-attrib-button:focus,
        .railyard-world-map .maplibregl-ctrl-attrib-button:focus-visible,
        .railyard-world-map .maplibregl-ctrl-attrib-button:active,
        .railyard-world-map .maplibregl-ctrl-attrib.maplibregl-compact:focus-within {
          outline: none !important;
          box-shadow: none !important;
          border-color: color-mix(in oklab, var(--color-border) 82%, transparent) !important;
        }

        .dark .railyard-world-map .maplibregl-ctrl-attrib.maplibregl-compact {
          background: color-mix(in oklab, var(--color-card) 82%, black 18%);
          border-color: color-mix(in oklab, var(--color-border) 70%, black 30%);
          color: color-mix(in oklab, var(--color-foreground) 82%, white 18%);
        }

        .dark .railyard-world-map .maplibregl-ctrl-attrib.maplibregl-compact a {
          color: color-mix(in oklab, var(--suite-accent-dark) 78%, white 22%);
        }

        .dark .railyard-world-map .maplibregl-ctrl-attrib-button {
          background-color: var(--color-background);
          color: var(--color-foreground);
          border-color: color-mix(in oklab, var(--color-border) 78%, transparent);
          filter: none;
          opacity: 1;
        }

        .railyard-world-map .maplibregl-canvas-container,
        .railyard-world-map .maplibregl-canvas {
          touch-action: none;
        }

        .railyard-world-map .maplibregl-canvas-container.maplibregl-interactive {
          cursor: grab;
        }

        .railyard-world-map .maplibregl-canvas-container.maplibregl-interactive:active {
          cursor: grabbing;
        }

        .railyard-world-map .maplibregl-control-container {
          z-index: 40;
        }

        .railyard-world-map .maplibregl-ctrl-bottom-left,
        .railyard-world-map .maplibregl-ctrl-bottom-right,
        .railyard-world-map .maplibregl-ctrl-top-left,
        .railyard-world-map .maplibregl-ctrl-top-right {
          z-index: 40;
        }
      `}</style>
      <div
        ref={containerRef}
        className="h-full w-full rounded-none"
        aria-label="World map"
      />

      <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn?.({ duration: 220 })}
          className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent dark:bg-card/90 sm:size-9"
          aria-label="Zoom in"
        >
          <Plus className="size-3.5 sm:size-4" strokeWidth={2.3} />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut?.({ duration: 220 })}
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
                  ? 'absolute transform-gpu transition-[left,top,opacity,transform] duration-230 ease-out'
                  : 'absolute transform-gpu transition-opacity duration-120 ease-out'
              }
              style={{
                left: `${marker.x}px`,
                top: `${marker.y}px`,
                transform: 'translate(-50%, -100%)',
                opacity: 1,
                pointerEvents: 'auto',
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
                if (marker.maps.length === 1) {
                  window.location.href = `/railyard/maps/${marker.maps[0].id}`;
                }
              }}
              aria-label={
                marker.maps.length === 1
                  ? `Open ${marker.maps[0].name}`
                  : `Cluster of ${marker.maps.length} maps`
              }
            >
              <span
                className={
                  modePulse
                    ? 'scale-[0.94] opacity-90 transition-[transform,opacity] duration-200'
                    : isHovered
                      ? 'scale-105 transition-transform duration-150'
                      : 'scale-100 transition-transform duration-150'
                }
              >
                <MarkerBox
                  clusterSize={marker.clusterSize}
                  animate={modePulse}
                />
              </span>
            </button>
          );
        })}
      </div>

      {hoveredMarker && hoveredMap ? (
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
          >
            <ItemCard
              type="map"
              item={hoveredMap}
              viewMode="compact"
              totalDownloads={mapDownloadTotals[hoveredMap.id] ?? 0}
            />
            {hoveredMaps.length > 1 ? (
              <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setHoverIndex(
                      (current) =>
                        (current - 1 + hoveredMaps.length) % hoveredMaps.length,
                    );
                  }}
                  className="rounded-md border border-border bg-background/70 px-2 py-1 hover:bg-accent"
                >
                  Prev
                </button>
                <span>
                  {(hoverIndex % hoveredMaps.length) + 1} / {hoveredMaps.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setHoverIndex(
                      (current) => (current + 1) % hoveredMaps.length,
                    );
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
    </div>
  );
}
