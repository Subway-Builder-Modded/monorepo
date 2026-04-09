/**
 * roads.js — Fetch road network from Overpass and save to processed_data.
 *
 * Reads:  config.json (place list)
 * Writes: raw_data/{code}/roads.geojson
 *         processed_data/{code}/roads.geojson  (same file, direct copy)
 *
 * CLI usage:
 *   node src/roads.js [--place <code>]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runQuery, getStreetName, toOverpassBbox } from './utils/overpass.js';
import { writeJsonFile } from './utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const ROAD_TYPES = {
  motorway: 'highway',
  motorway_link: 'highway',
  trunk: 'major',
  trunk_link: 'major',
  primary: 'major',
  primary_link: 'major',
  secondary: 'minor',
  secondary_link: 'minor',
  tertiary: 'minor',
  tertiary_link: 'minor',
  unclassified: 'minor',
  residential: 'minor',
};

export async function fetchRoads(place) {
  const bbox = toOverpassBbox(place.bbox);
  const locale = place.locale ?? 'en';

  const query = `
[out:json][timeout:180];
(
  way["highway"="motorway"](${bbox.join(',')});
  way["highway"="motorway_link"](${bbox.join(',')});
  way["highway"="trunk"](${bbox.join(',')});
  way["highway"="trunk_link"](${bbox.join(',')});
  way["highway"="primary"](${bbox.join(',')});
  way["highway"="primary_link"](${bbox.join(',')});
  way["highway"="secondary"](${bbox.join(',')});
  way["highway"="secondary_link"](${bbox.join(',')});
  way["highway"="tertiary"](${bbox.join(',')});
  way["highway"="tertiary_link"](${bbox.join(',')});
  way["highway"="unclassified"](${bbox.join(',')});
  way["highway"="residential"](${bbox.join(',')});
);
out geom;`;

  console.log(`[roads] Querying Overpass for ${place.name} (${place.code})…`);
  console.time(`[roads] ${place.code}`);
  const data = await runQuery(query);
  console.timeEnd(`[roads] ${place.code}`);
  console.log(`[roads] ${place.code}: ${data.elements.length} ways`);

  return {
    type: 'FeatureCollection',
    features: data.elements.map((el) => ({
      type: 'Feature',
      properties: {
        roadClass: ROAD_TYPES[el.tags.highway] ?? 'minor',
        structure: 'normal',
        name: getStreetName(el.tags, locale),
      },
      geometry: {
        type: 'LineString',
        coordinates: el.geometry.map((c) => [c.lon, c.lat]),
      },
    })),
  };
}

async function run(placeCode) {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  const places = placeCode
    ? config.places.filter((p) => p.code === placeCode)
    : config.places;

  if (!places.length) {
    console.error(`[roads] No place found with code "${placeCode}"`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(ROOT, 'raw_data'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'processed_data'), { recursive: true });

  for (const place of places) {
    fs.mkdirSync(path.join(ROOT, 'raw_data', place.code), { recursive: true });
    fs.mkdirSync(path.join(ROOT, 'processed_data', place.code), { recursive: true });

    const geojson = await fetchRoads(place);

    const rawPath = path.join(ROOT, 'raw_data', place.code, 'roads.geojson');
    const processedPath = path.join(ROOT, 'processed_data', place.code, 'roads.geojson');

    console.log(`[roads] Writing ${place.code}/roads.geojson…`);
    await writeJsonFile(rawPath, geojson);
    fs.copyFileSync(rawPath, processedPath);
    console.log(`[roads] Done: ${place.code}`);
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const placeArg = process.argv.indexOf('--place');
  const placeCode = placeArg !== -1 ? process.argv[placeArg + 1] : null;
  run(placeCode).catch((err) => {
    console.error('[roads] Fatal:', err.message);
    process.exit(1);
  });
}
