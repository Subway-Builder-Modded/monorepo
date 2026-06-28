import type { Bbox, GridFeature, GridSnapshot } from "./map-tab-types";
import { METRIC_ORDER, METRIC_SOURCE_KEYS } from "./map-tab-metrics";

export function expandBboxByFactor(bbox: Bbox, factor: number): Bbox {
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

export function normalizeMapGrid(mapId: string, grid: unknown): GridSnapshot {
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
