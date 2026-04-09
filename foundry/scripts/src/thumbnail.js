/**
 * thumbnail.js — Generate a water-layer SVG thumbnail for a city by fetching
 * tiles from a local tile server (http://127.0.0.1:8080).
 *
 * This module is intended to be imported and called, not run directly,
 * because it requires a live local tile server serving the city's PMTiles.
 */

import { VectorTile } from '@mapbox/vector-tile';
import Protobuf from 'pbf';
import { GeoJSON2SVG } from 'geojson2svg';
import * as turf from '@turf/turf';
import { SphericalMercator } from '@mapbox/sphericalmercator';

const mercator = new SphericalMercator({ size: 800, antimeridian: true });

async function fetchWithRetry(url, retries = 5, delay = 200) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[thumbnail] Fetch ${url} failed (attempt ${attempt}): ${err.message}. Retrying in ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

const lon2tile = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2tile = (lat, z) =>
  Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z,
  );

/**
 * Generate an 800×800 SVG thumbnail showing water features.
 *
 * @param {string} cityCode - city code, used to request tiles from the local server
 * @param {{ bbox: number[], thumbnailBbox?: number[] }} cityConfig
 * @returns {Promise<string>} SVG markup string
 */
export async function generateThumbnail(cityCode, cityConfig) {
  const bbox = cityConfig.thumbnailBbox ?? cityConfig.bbox;

  const minX = lon2tile(bbox[0], 12);
  const maxY = lat2tile(bbox[1], 12);
  const maxX = lon2tile(bbox[2], 12);
  const minY = lat2tile(bbox[3], 12);

  const tileRequests = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tileRequests.push(
        fetchWithRetry(`http://127.0.0.1:8080/${cityCode}/12/${x}/${y}.mvt`)
          .then((r) => r.arrayBuffer())
          .then((buf) => ({ x, y, buffer: buf })),
      );
    }
  }

  const tiles = await Promise.all(tileRequests);

  const features = { type: 'FeatureCollection', features: [] };

  tiles.forEach(({ x, y, buffer }) => {
    const tile = new VectorTile(new Protobuf(buffer));
    const water = tile.layers['water'];
    if (!water) return;
    for (let i = 0; i < water.length; i++) {
      features.features.push(water.feature(i).toGeoJSON(x, y, 12));
    }
  });

  // Buffer line-string water features so they render as filled areas
  features.features = features.features.map((f) => {
    if (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString') {
      const width = f.properties.min_zoom >= 10 ? 0.00025 : 0.0005;
      return turf.buffer(f, width, { units: 'degrees' });
    }
    return f;
  });

  const converter = new GeoJSON2SVG({
    viewportSize: { width: 800, height: 800 },
    coordinateConverter: mercator.forward,
    precision: 2,
    fitTo: 'height',
  });

  const paths = converter.convert(features).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet" stroke-linecap="round" stroke-linejoin="round">
  <defs>
    <style>
      :root { --water-color: #9FC9EA; --bg-color: #F2E7D3; }
      svg { background: var(--bg-color); }
      path, polygon, rect, circle { fill: var(--water-color); stroke: none; }
    </style>
  </defs>
  <g id="water">
    ${paths}
  </g>
</svg>`;
}
