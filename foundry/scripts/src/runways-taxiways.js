/**
 * runways-taxiways.js — Fetch airport runways, taxiways, and aprons from
 * Overpass and save to processed_data.
 *
 * Reads:  config.json
 * Writes: raw_data/{code}/runways_taxiways.geojson
 *         processed_data/{code}/runways_taxiways.geojson
 *
 * CLI usage:
 *   node src/runways-taxiways.js [--place <code>]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';
import { runQuery, toOverpassBbox } from './utils/overpass.js';
import { writeJsonFile } from './utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

export async function fetchRunwaysTaxiways(place) {
  const bbox = toOverpassBbox(place.bbox);

  const query = `
[out:json][timeout:180];
(
  way["aeroway"="runway"](${bbox.join(',')});
  way["aeroway"="taxiway"](${bbox.join(',')});
  way["aeroway"="apron"](${bbox.join(',')});
);
out geom;`;

  console.log(`[runways-taxiways] Querying Overpass for ${place.name} (${place.code})…`);
  console.time(`[runways-taxiways] ${place.code}`);
  const data = await runQuery(query);
  console.timeEnd(`[runways-taxiways] ${place.code}`);
  console.log(`[runways-taxiways] ${place.code}: ${data.elements.length} elements`);

  const features = data.elements.map((el) => {
    const coords = el.geometry.map((c) => [c.lon, c.lat]);
    const aeroway = el.tags.aeroway;

    if (aeroway === 'runway' || aeroway === 'taxiway') {
      // Buffer the centerline into a polygon
      const width = aeroway === 'runway' ? 30 : 10; // meters
      const buffered = turf.buffer(turf.lineString(coords), width, { units: 'meters' });
      return {
        type: 'Feature',
        properties: {
          roadType: 'runway',
          z_order: 0,
          osm_way_id: String(el.id),
          area: turf.area(turf.lineString(coords)),
        },
        geometry: {
          type: 'Polygon',
          coordinates: buffered.geometry.coordinates,
        },
      };
    }

    // apron — treat as polygon directly
    return {
      type: 'Feature',
      properties: {
        roadType: 'runway',
        aeroway,
        osm_way_id: String(el.id),
        area: turf.area(turf.polygon([coords])),
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    };
  });

  return { type: 'FeatureCollection', features };
}

async function run(placeCode) {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  const places = placeCode
    ? config.places.filter((p) => p.code === placeCode)
    : config.places;

  if (!places.length) {
    console.error(`[runways-taxiways] No place found with code "${placeCode}"`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(ROOT, 'raw_data'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'processed_data'), { recursive: true });

  for (const place of places) {
    fs.mkdirSync(path.join(ROOT, 'raw_data', place.code), { recursive: true });
    fs.mkdirSync(path.join(ROOT, 'processed_data', place.code), { recursive: true });

    const geojson = await fetchRunwaysTaxiways(place);

    const rawPath = path.join(ROOT, 'raw_data', place.code, 'runways_taxiways.geojson');
    const processedPath = path.join(ROOT, 'processed_data', place.code, 'runways_taxiways.geojson');

    console.log(`[runways-taxiways] Writing ${place.code}/runways_taxiways.geojson…`);
    await writeJsonFile(rawPath, geojson);
    fs.copyFileSync(rawPath, processedPath);
    console.log(`[runways-taxiways] Done: ${place.code}`);
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const placeArg = process.argv.indexOf('--place');
  const placeCode = placeArg !== -1 ? process.argv[placeArg + 1] : null;
  run(placeCode).catch((err) => {
    console.error('[runways-taxiways] Fatal:', err.message);
    process.exit(1);
  });
}
