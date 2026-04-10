'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, MapPin } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@subway-builder-modded/shared-ui';

type Bbox = [number, number, number, number];
type MetricId =
  | 'residentCount'
  | 'jobCount'
  | 'pointDensity'
  | 'workToHomeCommuteDistance'
  | 'homeToWorkCommuteDistance';

type GridFeature = {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
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
    type: 'FeatureCollection';
    features: GridFeature[];
  };
};

type MapLibreBoundsLike = [[number, number], [number, number]];

type MapInstance = {
  fitBounds: (
    bounds: MapLibreBoundsLike,
    options?: { padding?: number; duration?: number; maxZoom?: number },
  ) => void;
  addSource: (id: string, source: unknown) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  setLayoutProperty: (layerId: string, name: string, value: unknown) => void;
  getZoom: () => number;
  getBounds: () => {
    toArray: () => MapLibreBoundsLike;
  };
  setMinZoom: (zoom: number) => void;
  setMaxBounds: (bounds: MapLibreBoundsLike) => void;
  dragPan?: {
    enable: () => void;
    disable: () => void;
  };
  queryRenderedFeatures?: (
    point?: { x: number; y: number },
    options?: { layers?: string[] },
  ) => Array<{
    properties?: Record<string, unknown>;
  }>;
  remove: () => void;
  on: (...args: unknown[]) => void;
  off: (...args: unknown[]) => void;
  isStyleLoaded?: () => boolean;
  getSource?: (id: string) => unknown;
};

type HoverInfo = {
  x: number;
  y: number;
  values: Record<MetricId, number>;
  centroidLng: number | null;
  centroidLat: number | null;
};

type MapLibreGlobal = {
  Map: new (options: Record<string, unknown>) => MapInstance;
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

const MAPLIBRE_SCRIPT_SRC =
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
const MAPLIBRE_SCRIPT_ID = 'maplibre-gl-script';
const BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const GRID_SOURCE_ID = 'registry-grid-source';
const OUTLINE_LAYER_ID = 'registry-grid-outline';
const HEAT_LAYER_PREFIX = 'registry-grid-heat-';
const INITIAL_BOUNDS_EXPANSION_FACTOR = 3;

const METRIC_CONFIG: Record<
  MetricId,
  { label: string; shortLabel: string; unit?: string }
> = {
  residentCount: {
    label: 'Resident Count',
    shortLabel: 'Residents',
  },
  jobCount: {
    label: 'Job Count',
    shortLabel: 'Jobs',
  },
  pointDensity: {
    label: 'Point Density',
    shortLabel: 'Points',
  },
  workToHomeCommuteDistance: {
    label: 'Work -> Home Commute Distance',
    shortLabel: 'Work -> Home',
    unit: 'm',
  },
  homeToWorkCommuteDistance: {
    label: 'Home -> Work Commute Distance',
    shortLabel: 'Home -> Work',
    unit: 'm',
  },
};

const METRIC_ORDER: MetricId[] = [
  'residentCount',
  'jobCount',
  'pointDensity',
  'workToHomeCommuteDistance',
  'homeToWorkCommuteDistance',
];

const HEAT_COLORS = [
  '#0a1220',
  '#0f2f5f',
  '#1756a9',
  '#1c7ed6',
  '#339af0',
  '#4dabf7',
  '#74c0fc',
  '#a5d8ff',
  '#e7f5ff',
];

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
    roads: '#3d4250',
    buildings: '#2a3040',
    water: '#0d1722',
    background: '#05070d',
    parks: '#111720',
    airports: '#141a24',
    runways: '#1f2733',
    roadLabel: '#5a6272',
    roadLabelHalo: '#0a0d15',
    neighborhoodLabel: '#687284',
    neighborhoodLabelHalo: '#0a0d15',
    cityLabel: '#8e98ac',
    cityLabelHalo: '#0a0d15',
  },
};

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

function loadMapLibre(): Promise<MapLibreGlobal> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not available'));
  }

  const existingMapLibre = (window as Window & { maplibregl?: MapLibreGlobal })
    .maplibregl;
  if (existingMapLibre) return Promise.resolve(existingMapLibre);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(
      MAPLIBRE_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => {
        const loadedMapLibre = (
          window as Window & {
            maplibregl?: MapLibreGlobal;
          }
        ).maplibregl;
        if (loadedMapLibre) resolve(loadedMapLibre);
      });
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load MapLibre script')),
      );
      return;
    }

    const script = document.createElement('script');
    script.id = MAPLIBRE_SCRIPT_ID;
    script.src = MAPLIBRE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      const loadedMapLibre = (
        window as Window & {
          maplibregl?: MapLibreGlobal;
        }
      ).maplibregl;
      if (!loadedMapLibre) {
        reject(
          new Error('MapLibre script loaded but window.maplibregl is missing'),
        );
        return;
      }
      resolve(loadedMapLibre);
    };
    script.onerror = () => reject(new Error('Failed to load MapLibre script'));
    document.head.appendChild(script);
  });
}

function compactNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);
}

function formatMetricValue(metricId: MetricId, value: number) {
  if (
    metricId === 'residentCount' ||
    metricId === 'jobCount' ||
    metricId === 'pointDensity'
  ) {
    if (value >= 1000) return compactNumber(value);
    return Math.round(value).toLocaleString('en-US');
  }
  const unit = METRIC_CONFIG[metricId].unit;
  if (unit === 'm') {
    const kilometers = value / 1000;
    const rounded = Number(
      kilometers >= 100 ? kilometers.toFixed(0) : kilometers.toFixed(1),
    );
    return `${rounded} km`;
  }
  const formatted = value >= 1000 ? compactNumber(value) : value.toFixed(1);
  return unit ? `${formatted} ${unit}` : formatted;
}

function readNumericProperty(
  properties: Record<string, unknown>,
  key: string,
): number {
  const raw = properties[key];
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCoord(value: number | null) {
  if (!Number.isFinite(value ?? NaN)) return '—';
  return Number(value).toFixed(4);
}

function expandBboxByFactor(bbox: Bbox, factor: number): Bbox {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const halfLng = ((maxLng - minLng) / 2) * factor;
  const halfLat = ((maxLat - minLat) / 2) * factor;
  return [
    centerLng - halfLng,
    centerLat - halfLat,
    centerLng + halfLng,
    centerLat + halfLat,
  ];
}

export function RegistryMapPreview({ mapId }: { mapId: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const activeMetricRef = useRef<MetricId>('residentCount');
  const { resolvedTheme } = useTheme();
  const [snapshot, setSnapshot] = useState<GridSnapshot | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>(
    'loading',
  );
  const [activeMetric, setActiveMetric] = useState<MetricId>('residentCount');
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  useEffect(() => {
    activeMetricRef.current = activeMetric;
  }, [activeMetric]);

  const mapTheme: ResolvedTheme = isMapTheme(resolvedTheme)
    ? resolvedTheme
    : 'dark';

  useEffect(() => {
    let canceled = false;
    setStatus('loading');
    setSnapshot(null);
    setHoverInfo(null);

    void (async () => {
      try {
        const response = await fetch(
          `/registry/map-grids/${encodeURIComponent(mapId)}.json`,
          { cache: 'no-store' },
        );
        if (!response.ok) {
          if (!canceled) setStatus('empty');
          return;
        }

        const payload = (await response.json()) as GridSnapshot;
        if (!Array.isArray(payload?.geojson?.features) || !payload.bbox) {
          if (!canceled) setStatus('empty');
          return;
        }

        if (!canceled) {
          setSnapshot(payload);
          setStatus('ready');
        }
      } catch {
        if (!canceled) setStatus('error');
      }
    })();

    return () => {
      canceled = true;
    };
  }, [mapId]);

  useEffect(() => {
    if (status !== 'ready' || !snapshot || !containerRef.current) return;

    let disposed = false;
    let map: MapInstance | null = null;
    let handleLoad: (() => void) | null = null;

    void (async () => {
      try {
        const maplibregl = await loadMapLibre();
        const style = await buildThemedStyle(mapTheme);
        if (disposed || !containerRef.current) return;

        map = new maplibregl.Map({
          container: containerRef.current,
          style,
          attributionControl: true,
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
              type: 'geojson',
              data: snapshot.geojson,
            });

            for (const metricId of METRIC_ORDER) {
              const stats = snapshot.metrics?.[metricId];
              const recommendedMax =
                stats?.recommendedMax && stats.recommendedMax > 0
                  ? stats.recommendedMax
                  : 1;
              const stops = HEAT_COLORS.map((color, index) => [
                (recommendedMax * index) / (HEAT_COLORS.length - 1),
                color,
              ]);

              map.addLayer({
                id: `${HEAT_LAYER_PREFIX}${metricId}`,
                type: 'fill',
                source: GRID_SOURCE_ID,
                layout: {
                  visibility:
                    metricId === activeMetricRef.current ? 'visible' : 'none',
                },
                paint: {
                  'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['coalesce', ['get', metricId], 0],
                    ...stops.flat(),
                  ],
                  'fill-opacity': 0.8,
                },
              });
            }

            map.addLayer({
              id: OUTLINE_LAYER_ID,
              type: 'line',
              source: GRID_SOURCE_ID,
              paint: {
                'line-color': 'rgb(0, 0, 0)',
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  7,
                  0.25,
                  10,
                  0.5,
                  13,
                  0.75,
                ],
                'line-opacity': 1,
              },
            });
          }

          const initialBounds = expandBboxByFactor(
            snapshot.bbox,
            INITIAL_BOUNDS_EXPANSION_FACTOR,
          );
          const boundsForMap: MapLibreBoundsLike = [
            [initialBounds[0], initialBounds[1]],
            [initialBounds[2], initialBounds[3]],
          ];

          map.fitBounds(boundsForMap, {
            padding: 20,
            duration: 0,
            maxZoom: 12,
          });
          const initialZoom = map.getZoom();
          const initialViewportBounds = map.getBounds().toArray();
          map.setMinZoom(initialZoom);
          map.setMaxBounds(initialViewportBounds);
          const updatePanLock = () => {
            if (!map?.dragPan) return;
            if (map.getZoom() <= initialZoom + 0.0001) {
              map.dragPan.disable();
            } else {
              map.dragPan.enable();
            }
          };
          updatePanLock();
          map.on('zoom', updatePanLock);
          map.on('zoomend', updatePanLock);
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
            const properties = (feature?.properties ?? {}) as Record<
              string,
              unknown
            >;
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
              const value = Number(properties['centroidLng']);
              return Number.isFinite(value) ? value : null;
            })();
            const centroidLat = (() => {
              const value = Number(properties['centroidLat']);
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
          map.on('mousemove', handleMove);
          map.on('mouseleave', handleLeave);
        };

        map.on('load', handleLoad);
        if (map.isStyleLoaded?.()) handleLoad();
      } catch {
        if (!disposed) setStatus('error');
      }
    })();

    return () => {
      disposed = true;
      if (map && handleLoad) map.off('load', handleLoad);
      mapRef.current = null;
      map?.remove();
    };
  }, [mapTheme, snapshot, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const metricId of METRIC_ORDER) {
      map.setLayoutProperty(
        `${HEAT_LAYER_PREFIX}${metricId}`,
        'visibility',
        metricId === activeMetric ? 'visible' : 'none',
      );
    }
  }, [activeMetric]);

  const metricStats = snapshot?.metrics?.[activeMetric];
  const legendMin = metricStats?.min ?? 0;
  const legendMax = metricStats?.recommendedMax ?? metricStats?.max ?? 0;

  const summaryText = useMemo(() => {
    if (!snapshot || !metricStats) return '';
    return `${compactNumber(metricStats.nonZeroCount)} active cells`;
  }, [metricStats, snapshot]);

  if (status === 'loading') {
    return (
      <div className="flex h-[26rem] items-center justify-center rounded-xl border border-border/65 bg-muted/25 text-sm text-muted-foreground">
        Loading map layers...
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="flex h-[26rem] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
        <div className="space-y-2">
          <MapPin className="mx-auto size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Heatmap grid data is not available for this map yet.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-[26rem] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
        <div className="space-y-2">
          <AlertCircle className="mx-auto size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Unable to load map heatmap data right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {METRIC_ORDER.map((metricId) => {
          const isActive = activeMetric === metricId;
          return (
            <button
              key={metricId}
              type="button"
              onClick={() => setActiveMetric(metricId)}
              className={cn(
                'group rounded-lg border px-3 py-2 text-left transition-all',
                isActive
                  ? 'border-[#1c7ed6] bg-[#10243f]/65 text-foreground shadow-[0_0_0_1px_rgba(28,126,214,0.35)]'
                  : 'border-border/70 bg-card/65 text-muted-foreground hover:border-[#1c7ed6]/60 hover:bg-[#10243f]/65 hover:text-foreground',
              )}
            >
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em]">
                Layer
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-tight">
                {METRIC_CONFIG[metricId].shortLabel}
              </p>
            </button>
          );
        })}
      </div>

      <div className="overflow-visible rounded-xl border border-border/60 bg-card/65 p-1.5 ring-1 ring-foreground/5">
        <div className="relative h-[26rem] w-full overflow-visible rounded-lg">
          <div className="h-full w-full overflow-hidden rounded-lg">
            <div
              ref={containerRef}
              className="h-full w-full"
              aria-label="City map"
            />
          </div>
          {hoverInfo ? (
            <div
              className="pointer-events-none absolute z-40 w-[15rem] rounded-lg border border-border/70 bg-[#0b0f17]/94 p-3 backdrop-blur-sm"
              style={{
                left: `${hoverInfo.x}px`,
                top: `${hoverInfo.y}px`,
                transform: 'translate(14px, 14px)',
              }}
            >
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Grid Cell
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCoord(hoverInfo.centroidLat)},{' '}
                {formatCoord(hoverInfo.centroidLng)}
              </p>
              <div className="mt-2 space-y-1.5">
                {METRIC_ORDER.map((metricId) => {
                  const isActive = metricId === activeMetric;
                  return (
                    <div
                      key={metricId}
                      className={cn(
                        'flex items-center justify-between text-xs',
                        isActive
                          ? 'font-semibold text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      <span>{METRIC_CONFIG[metricId].shortLabel}</span>
                      <span>
                        {formatMetricValue(
                          metricId,
                          hoverInfo.values[metricId],
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 rounded-lg border border-border/70 bg-[#0b0f17]/90 px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span>{METRIC_CONFIG[activeMetric].label}</span>
              <span>{summaryText}</span>
            </div>
            <div
              className="mt-2 h-2 w-full rounded-sm"
              style={{
                backgroundImage: `linear-gradient(to right, ${HEAT_COLORS[0]}, ${HEAT_COLORS[4]}, ${HEAT_COLORS[HEAT_COLORS.length - 1]})`,
              }}
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatMetricValue(activeMetric, legendMin)}</span>
              <span>{formatMetricValue(activeMetric, legendMax)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
