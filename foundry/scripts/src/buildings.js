/**
 * buildings.js — Fetch building footprints from Overpass, build a spatial
 * grid index, and write buildings_index.json to processed_data.
 *
 * Reads:  config.json
 * Writes: raw_data/{code}/buildings.json         (raw OSM elements)
 *         processed_data/{code}/buildings_index.json
 *
 * CLI usage:
 *   node src/buildings.js [--place <code>]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';
import { runQuery, toOverpassBbox } from './utils/overpass.js';
import { runQueryOverture } from './utils/overture.js';
import { writeJsonFile, readJsonFile } from './utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Matching cell size used in the base game
const CELL_SIZE = 0.0009; // degrees latitude

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchBuildings(place) {
  const bbox = toOverpassBbox(place.bbox);

  const query = `
[out:json][timeout:180];
(
  way["building"](${bbox.join(',')});
);
out geom;`;

  console.log(`[buildings] Querying Overpass for ${place.name} (${place.code})…`);
  console.time(`[buildings] fetch ${place.code}`);
  const data = await runQuery(query);
  console.timeEnd(`[buildings] fetch ${place.code}`);
  console.log(`[buildings] ${place.code}: ${data.elements.length} buildings`);

  return data.elements;
}

//NON-WORKING
// ─── Fetch by Overture ────────────────────────────────────────────────────────────

export async function fetchBuildingsOverture(place) {
  const query = ` 
    SELECT 
      id, 
      names.primary AS name,
      geometry, 
      subtype, 
      num_floors_underground AS foundationDepth,

    FROM read_parquet('s3://overturemaps-us-west-2/release/2026-03-18.0/theme=buildings/type=building/*')
    WHERE 
      bbox.xmin BETWEEN ${place.bbox[0]} AND ${place.bbox[2]}
      AND bbox.ymin BETWEEN ${place.bbox[1]} AND ${place.bbox[3]}
  `; // TODO: update to latest dataset - 2 days.

  console.log(`[buildings]Querying Overture for ${place.name} (${place.code})… with bbox ${place.bbox.join(',')}`);
  console.time(`[buildings] fetch ${place.code}`);
  const data = await runQueryOverture(query);
  console.timeEnd(`[buildings] fetch ${place.code}`);
  console.log(`[buildings] ${place.code}: ${data.getRows().length} buildings`);
  return data.getRowObjectsJson(); // I think this will make JSON? 
}

// ─── Process ─────────────────────────────────────────────────────────────────

function optimizeBuilding(b) {
  return {
    b: [b.minX, b.minY, b.maxX, b.maxY],
    f: b.foundationDepth,
    p: b.polygon,
  };
}

function optimizeIndex(idx) {
  return {
    cs: CELL_SIZE,
    bbox: [idx.minLon, idx.minLat, idx.maxLon, idx.maxLat],
    grid: [idx.cols, idx.rows],
    cells: Object.keys(idx.cells).map((key) => [
      ...key.split(',').map(Number),
      ...idx.cells[key],
    ]),
    buildings: idx.buildings.map(optimizeBuilding),
    stats: {
      count: idx.buildings.length,
      maxDepth: idx.maxDepth,
    },
  };
}

export function processBuildings(rawBuildings) {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  const processed = {};

  rawBuildings.forEach((building, i) => {
    let bMinLon = Infinity, bMinLat = Infinity, bMaxLon = -Infinity, bMaxLat = -Infinity;

    const points = building.geometry.map((c) => {
      if (c.lon < minLon) minLon = c.lon;
      if (c.lat < minLat) minLat = c.lat;
      if (c.lon > maxLon) maxLon = c.lon;
      if (c.lat > maxLat) maxLat = c.lat;

      if (c.lon < bMinLon) bMinLon = c.lon;
      if (c.lat < bMinLat) bMinLat = c.lat;
      if (c.lon > bMaxLon) bMaxLon = c.lon;
      if (c.lat > bMaxLat) bMaxLat = c.lat;

      return [c.lon, c.lat];
    });

    // Ensure ring is closed
    if (
      points[0][0] !== points[points.length - 1][0] ||
      points[0][1] !== points[points.length - 1][1]
    ) {
      points.push(points[0]);
    }
    if (points.length < 4) return;

    const poly = turf.polygon([points]);
    const center = turf.centerOfMass(poly);

    processed[i] = {
      id: i,
      bbox: { minLon: bMinLon, minLat: bMinLat, maxLon: bMaxLon, maxLat: bMaxLat },
      center: center.geometry.coordinates,
      geometry: poly.geometry.coordinates,
      tags: building.tags,
    };
  });

  // Build grid — correct for longitude distortion at this latitude
  const latMid = (minLat + maxLat) / 2;
  const cs_x = CELL_SIZE / Math.cos(latMid * (Math.PI / 180));

  const cols = Math.ceil((maxLon - minLon) / cs_x) + 1;
  const rows = Math.ceil((maxLat - minLat) / CELL_SIZE) + 1;

  // Assign buildings to columns
  Object.values(processed).forEach((b) => {
    b.xCellCoord = Math.floor((b.center[0] - minLon) / cs_x);
    b.yCellCoord = Math.floor((b.center[1] - minLat) / CELL_SIZE);
  });

  // Build cell → building ID map
  const cells = {};
  Object.values(processed).forEach((b) => {
    const key = `${b.xCellCoord},${b.yCellCoord}`;
    if (!cells[key]) cells[key] = [];
    cells[key].push(b.id);
  });

  let maxDepth = 1;

  return optimizeIndex({
    minLon, minLat, maxLon, maxLat,
    cols, rows,
    cells,
    buildings: Object.values(processed).map((b) => {
      const depth = b.tags['building:levels:underground']
        ? Number(b.tags['building:levels:underground'])
        : 1;
      if (depth > maxDepth) maxDepth = depth;

      return {
        minX: b.bbox.minLon,
        minY: b.bbox.minLat,
        maxX: b.bbox.maxLon,
        maxY: b.bbox.maxLat,
        foundationDepth: depth,
        polygon: b.geometry,
      };
    }),
    maxDepth,
  });
}

// ─── Entry ───────────────────────────────────────────────────────────────────

async function run(placeCode) {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  const places = placeCode
    ? config.places.filter((p) => p.code === placeCode)
    : config.places;

  if (!places.length) {
    console.error(`[buildings] No place found with code "${placeCode}"`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(ROOT, 'raw_data'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'processed_data'), { recursive: true });

  for (const place of places) {
    fs.mkdirSync(path.join(ROOT, 'raw_data', place.code), { recursive: true });
    fs.mkdirSync(path.join(ROOT, 'processed_data', place.code), { recursive: true });

    // Fetch
    const rawBuildings = await fetchBuildings(place);
    const rawPath = path.join(ROOT, 'raw_data', place.code, 'buildings.json');
    console.log(`[buildings] Writing raw data for ${place.code}…`);
    await writeJsonFile(rawPath, rawBuildings);

    // Process
    console.log(`[buildings] Processing index for ${place.code}…`);
    console.time(`[buildings] process ${place.code}`);
    const index = processBuildings(rawBuildings);
    console.timeEnd(`[buildings] process ${place.code}`);

    const outPath = path.join(ROOT, 'processed_data', place.code, 'buildings_index.json');
    console.log(`[buildings] Writing buildings_index.json for ${place.code}…`);
    await writeJsonFile(outPath, index);
    console.log(`[buildings] Done: ${place.code} — ${index.stats.count} buildings`);
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const placeArg = process.argv.indexOf('--place');
  const placeCode = placeArg !== -1 ? process.argv[placeArg + 1] : null;
  run(placeCode).catch((err) => {
    console.error('[buildings] Fatal:', err.message);
    process.exit(1);
  });
}
