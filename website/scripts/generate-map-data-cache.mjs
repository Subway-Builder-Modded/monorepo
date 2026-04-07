import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'public', 'registry', 'map-grids');
const INDEX_FILE = path.join(OUTPUT_DIR, 'index.json');
const LEGACY_BOUNDS_FILE = path.join(ROOT, 'public', 'registry', 'map-data.json');

const REPO_OWNER = 'Subway-Builder-Modded';
const REPO_NAME = 'registry';
const REPO_NAME_FALLBACK = 'The-Railyard';
const REPO_BRANCH = 'main';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}`;
const RAW_BASE_FALLBACK = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME_FALLBACK}/${REPO_BRANCH}`;

const TOKEN =
  process.env['RAILYARD_GITHUB_TOKEN']?.trim() ||
  '';

const METRICS = [
  {
    id: 'residentCount',
    sourceKey: 'pop',
    label: 'Resident Count',
  },
  {
    id: 'jobCount',
    sourceKey: 'jobs',
    label: 'Job Count',
  },
  {
    id: 'pointDensity',
    sourceKey: 'pointCount',
    label: 'Point Density',
  },
  {
    id: 'workToHomeCommuteDistance',
    sourceKey: 'workHomeCommuteMedian',
    label: 'Work->Home Commute Distance',
  },
  {
    id: 'homeToWorkCommuteDistance',
    sourceKey: 'homeWorkCommuteMedian',
    label: 'Home->Work Commute Distance',
  },
];

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  writeFileSync(file, JSON.stringify(value));
}

function buildHeaders() {
  const headers = {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    'User-Agent': 'subway-builder-modded-website/map-grid-cache',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return headers;
}

async function fetchJson(pathname) {
  const bases = [RAW_BASE, RAW_BASE_FALLBACK];
  let lastError;
  for (const base of bases) {
    const url = `${base}/${pathname}`;
    try {
      const response = await fetch(url, { headers: buildHeaders() });
      if (response.ok) return response.json();
      lastError = new Error(`${response.status} ${response.statusText} for ${url}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function readMapIds(indexData) {
  if (Array.isArray(indexData)) {
    return indexData.filter((entry) => typeof entry === 'string');
  }
  if (Array.isArray(indexData?.maps)) {
    return indexData.maps.filter((entry) => typeof entry === 'string');
  }
  return [];
}

function extractCoordinates(node, into) {
  if (!node) return;
  if (Array.isArray(node)) {
    if (node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
      into.push([node[0], node[1]]);
      return;
    }
    for (const child of node) {
      extractCoordinates(child, into);
    }
  }
}

function geometryBbox(geometry) {
  const coords = [];
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

function mergeBbox(left, right) {
  if (!left) return right;
  if (!right) return left;
  return [
    Math.min(left[0], right[0]),
    Math.min(left[1], right[1]),
    Math.max(left[2], right[2]),
    Math.max(left[3], right[3]),
  ];
}

function centroidFromBbox(bbox) {
  if (!bbox) return null;
  return {
    lng: (bbox[0] + bbox[2]) / 2,
    lat: (bbox[1] + bbox[3]) / 2,
  };
}

function numericValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  const position = (sortedValues.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];
  const weight = position - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function buildMetricStats(features) {
  const result = {};
  for (const metric of METRICS) {
    const values = features.map((feature) => feature.properties[metric.id]).filter((value) => value > 0);
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted.length > 0 ? sorted[0] : 0;
    const max = sorted.length > 0 ? sorted[sorted.length - 1] : 0;
    const p95 = percentile(sorted, 0.95);
    const p98 = percentile(sorted, 0.98);
    result[metric.id] = {
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

function normalizeFeature(feature) {
  const geometry = feature?.geometry;
  const type = geometry?.type;
  if (type !== 'Polygon' && type !== 'MultiPolygon') return null;
  const bbox = geometryBbox(geometry);
  const centroid = centroidFromBbox(bbox);
  if (!centroid) return null;

  const props = feature?.properties ?? {};
  const properties = {};
  for (const metric of METRICS) {
    properties[metric.id] = numericValue(props[metric.sourceKey]);
  }
  properties.centroidLng = centroid.lng;
  properties.centroidLat = centroid.lat;

  return {
    type: 'Feature',
    geometry,
    properties,
  };
}

function normalizeMapGrid(mapId, grid) {
  const sourceFeatures = Array.isArray(grid?.features) ? grid.features : [];
  const features = sourceFeatures.map(normalizeFeature).filter(Boolean);
  if (features.length === 0) {
    throw new Error(`No usable grid features for ${mapId}`);
  }

  const bbox = features.reduce(
    (current, feature) => mergeBbox(current, geometryBbox(feature.geometry)),
    null,
  );
  if (!bbox) {
    throw new Error(`No bbox could be computed for ${mapId}`);
  }

  return {
    mapId,
    generatedAt: new Date().toISOString(),
    bbox,
    featureCount: features.length,
    metrics: buildMetricStats(features),
    metricOrder: METRICS.map((metric) => ({
      id: metric.id,
      label: metric.label,
    })),
    geojson: {
      type: 'FeatureCollection',
      features,
    },
  };
}

async function main() {
  ensureDir(OUTPUT_DIR);

  if (!TOKEN) {
    console.warn(
      '[map-grids] Missing GitHub token (RAILYARD_GITHUB_TOKEN/GITHUB_TOKEN/GH_TOKEN). Using existing cache if present.',
    );
    return;
  }

  let mapIds = [];
  try {
    const indexData = await fetchJson('maps/index.json');
    mapIds = readMapIds(indexData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[map-grids] Failed to fetch maps/index.json: ${message}`);
    if (existsSync(INDEX_FILE)) {
      console.warn('[map-grids] Keeping existing map grid cache.');
      return;
    }
    throw error;
  }

  const previousIndex = readJson(INDEX_FILE, { maps: {} });
  const cachedMaps = { ...(previousIndex.maps ?? {}) };
  const failedMapIds = [];
  const successMapIds = [];

  for (const mapId of mapIds) {
    try {
      const grid = await fetchJson(`maps/${encodeURIComponent(mapId)}/grid.geojson`);
      const normalized = normalizeMapGrid(mapId, grid);
      const outputPath = path.join(OUTPUT_DIR, `${mapId}.json`);
      writeJson(outputPath, normalized);
      cachedMaps[mapId] = {
        file: `${mapId}.json`,
        bbox: normalized.bbox,
        featureCount: normalized.featureCount,
        metrics: normalized.metrics,
      };
      successMapIds.push(mapId);
    } catch (error) {
      failedMapIds.push(mapId);
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[map-grids] Failed ${mapId}: ${message}`);
    }
  }

  const nextIndex = {
    source: `${REPO_OWNER}/${REPO_NAME}@${REPO_BRANCH}`,
    generatedAt: new Date().toISOString(),
    mapCount: mapIds.length,
    cachedCount: successMapIds.length,
    failedMapIds: failedMapIds.sort((a, b) => a.localeCompare(b)),
    metrics: METRICS.map(({ id, label }) => ({ id, label })),
    maps: cachedMaps,
  };
  writeJson(INDEX_FILE, nextIndex);

  const legacyBounds = {
    source: nextIndex.source,
    generatedAt: nextIndex.generatedAt,
    mapCount: mapIds.length,
    cachedCount: successMapIds.length,
    boundsByMap: Object.fromEntries(
      Object.entries(cachedMaps).map(([mapId, meta]) => [mapId, meta.bbox]),
    ),
    failedMapIds: nextIndex.failedMapIds,
  };
  writeJson(LEGACY_BOUNDS_FILE, legacyBounds);

  console.log(
    `[map-grids] Cached ${successMapIds.length}/${mapIds.length} map grids to ${OUTPUT_DIR}.`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[map-grids] generation failed: ${message}`);
  process.exitCode = 0;
});
