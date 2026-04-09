/**
 * pmtiles.js — Download a regional PMTiles extract from Protomaps, extract
 * the water layer, and produce ocean_depth_index.json for processed_data.
 *
 * Reads:  config.json
 * Writes: map_tiles/{code}.pmtiles
 *         raw_data/{code}/water.geojson
 *         processed_data/{code}/ocean_depth_index.json
 *
 * Requires the `pmtiles` CLI binary at map_tiles/pmtiles (or in PATH).
 *
 * CLI usage:
 *   node src/pmtiles.js [--place <code>]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { SphericalMercator } from '@mapbox/sphericalmercator';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';
import * as turf from '@turf/turf';
import { writeJsonFile } from './utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const mercator = new SphericalMercator({ size: 256 });

// Resolve the pmtiles binary — bundled next to map_tiles/ or on PATH
function resolvePmtilesBin() {
  const bundled = path.join(ROOT, 'map_tiles', 'pmtiles');
  if (fs.existsSync(bundled)) return `"${bundled}"`;
  const bundledExe = bundled + '.exe';
  if (fs.existsSync(bundledExe)) return `"${bundledExe}"`;
  return 'pmtiles'; // fall back to PATH
}

// ─── Download ────────────────────────────────────────────────────────────────

function buildProtomapsUrl() {
  // Two days ago — today's and yesterday's builds may not be published yet
  const d = new Date(Date.now() - 172_800_000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `https://build.protomaps.com/${y}${m}${day}.pmtiles`;
}

export function downloadPmtiles(place, zoomLevel) {
  const bin = resolvePmtilesBin();
  const src = buildProtomapsUrl();
  const dest = path.join(ROOT, 'map_tiles', `${place.code}.pmtiles`);
  const bbox = place.bbox.join(',');

  console.log(`[pmtiles] Downloading tiles for ${place.name} (${place.code})…`);
  console.log(`[pmtiles] Source: ${src}`);
  console.time(`[pmtiles] download ${place.code}`);

  execSync(
    `${bin} extract ${src} --maxzoom=${zoomLevel} --bbox="${bbox}" "${dest}"`,
    { stdio: 'inherit' },
  );

  console.timeEnd(`[pmtiles] download ${place.code}`);
}

// ─── Extract water layer ─────────────────────────────────────────────────────

const WATER_KINDS = new Set(['ocean', 'basin', 'river', 'canal', 'lake', 'dock', 'water']);

export function extractWater(place, zoomLevel = 13) {
  const bin = resolvePmtilesBin();
  const pmtilesFile = path.join(ROOT, 'map_tiles', `${place.code}.pmtiles`);
  const outputDir = path.join(ROOT, 'raw_data', place.code);
  fs.mkdirSync(outputDir, { recursive: true });

  const xyz = mercator.xyz(place.bbox, zoomLevel);
  const features = [];

  console.log(`[pmtiles] Extracting water tiles for ${place.code} at z${zoomLevel}…`);

  for (let x = xyz.minX; x <= xyz.maxX; x++) {
    for (let y = xyz.minY; y <= xyz.maxY; y++) {
      try {
        const buffer = execSync(
          `${bin} tile "${pmtilesFile}" ${zoomLevel} ${x} ${y} | gzip -d -c`,
          { stdio: ['ignore', 'pipe', 'ignore'] },
        );
        if (!buffer.length) continue;

        const tile = new VectorTile(new Pbf(buffer));
        if (!tile.layers.water) continue;

        for (let i = 0; i < tile.layers.water.length; i++) {
          const f = tile.layers.water.feature(i);
          if (WATER_KINDS.has(f.properties.kind)) {
            features.push(f.toGeoJSON(x, y, zoomLevel));
          }
        }
      } catch {
        // Tile missing or decode error — skip
      }
    }
  }

  console.log(`[pmtiles] Extracted ${features.length} water features for ${place.code}`);

  const geojson = { type: 'FeatureCollection', features };
  fs.writeFileSync(path.join(outputDir, 'water.geojson'), JSON.stringify(geojson));
  return geojson;
}

// ─── Process water → ocean_depth_index ───────────────────────────────────────

export function processWater(place) {
  const inputPath = path.join(ROOT, 'raw_data', place.code, 'water.geojson');

  if (!fs.existsSync(inputPath)) {
    console.warn(`[pmtiles] No water.geojson for ${place.code} — skipping ocean depth index`);
    return null;
  }

  const geojson = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  if (!geojson.features?.length) {
    console.warn(`[pmtiles] water.geojson is empty for ${place.code}`);
    return null;
  }

  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;

  geojson.features.forEach((f) => {
    const [w, s, e, n] = turf.bbox(f);
    if (w < minLon) minLon = w;
    if (s < minLat) minLat = s;
    if (e > maxLon) maxLon = e;
    if (n > maxLat) maxLat = n;
  });

  const cs_y = 0.0027;
  const centerLat = (minLat + maxLat) / 2;
  const cs_x = cs_y / Math.cos(centerLat * (Math.PI / 180));
  const cols = Math.ceil((maxLon - minLon) / cs_x);
  const rows = Math.ceil((maxLat - minLat) / cs_y);

  const polygons = [];

  geojson.features.forEach((f) => {
    const flatten = (coordsList) => {
      const poly = turf.polygon(coordsList);
      polygons.push({
        b: turf.bbox(poly),
        d: -4,
        p: coordsList,
      });
    };

    if (f.geometry.type === 'Polygon') {
      flatten(f.geometry.coordinates);
    } else if (f.geometry.type === 'MultiPolygon') {
      f.geometry.coordinates.forEach(flatten);
    }
  });

  // Assign polygons to grid cells
  const cells = {};
  polygons.forEach((poly, i) => {
    const [w, s, e, n] = poly.b;
    const c0 = Math.max(0, Math.floor((w - minLon) / cs_x));
    const c1 = Math.min(cols - 1, Math.floor((e - minLon) / cs_x));
    const r0 = Math.max(0, Math.floor((s - minLat) / cs_y));
    const r1 = Math.min(rows - 1, Math.floor((n - minLat) / cs_y));

    for (let c = c0; c <= c1; c++) {
      for (let r = r0; r <= r1; r++) {
        const key = `${c},${r}`;
        if (!cells[key]) cells[key] = [];
        cells[key].push(i);
      }
    }
  });

  return {
    cs: cs_y,
    bbox: [minLon, minLat, maxLon, maxLat],
    grid: [cols, rows],
    cells: Object.keys(cells).map((k) => [...k.split(',').map(Number), ...cells[k]]),
    depths: polygons,
    stats: { count: polygons.length, minDepth: -4, maxDepth: -4 },
  };
}

// ─── Entry ───────────────────────────────────────────────────────────────────

async function run(placeCode) {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  const places = placeCode
    ? config.places.filter((p) => p.code === placeCode)
    : config.places;

  if (!places.length) {
    console.error(`[pmtiles] No place found with code "${placeCode}"`);
    process.exit(1);
  }

  const zoomLevel = config['tile-zoom-level'] ?? 13;
  fs.mkdirSync(path.join(ROOT, 'map_tiles'), { recursive: true });

  for (const place of places) {
    fs.mkdirSync(path.join(ROOT, 'raw_data', place.code), { recursive: true });
    fs.mkdirSync(path.join(ROOT, 'processed_data', place.code), { recursive: true });

    downloadPmtiles(place, zoomLevel);
    extractWater(place, zoomLevel);

    console.log(`[pmtiles] Processing water index for ${place.code}…`);
    const depthIndex = processWater(place);

    if (depthIndex) {
      const outPath = path.join(ROOT, 'processed_data', place.code, 'ocean_depth_index.json');
      await writeJsonFile(outPath, depthIndex);
      console.log(`[pmtiles] Done: ${place.code} — ${depthIndex.stats.count} water polygons`);
    }
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const placeArg = process.argv.indexOf('--place');
  const placeCode = placeArg !== -1 ? process.argv[placeArg + 1] : null;
  run(placeCode).catch((err) => {
    console.error('[pmtiles] Fatal:', err.message);
    process.exit(1);
  });
}
