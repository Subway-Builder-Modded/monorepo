import { createParseStream } from 'big-json';
import { Readable } from 'stream';

/**
 * Execute an Overpass API query and return the parsed JSON result.
 * Streams the response to handle large payloads without OOM.
 */
export async function runQuery(query) {
  const res = await fetch('https://maps.mail.ru/osm/tools/overpass/api/interpreter', {
    credentials: 'omit',
    headers: {
      'User-Agent': 'SubwayBuilder-DataGenerator (https://github.com/Subway-Builder-Modded)',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    body: `data=${encodeURIComponent(query)}`,
    method: 'POST',
    mode: 'cors',
  });

  if (!res.ok) {
    throw new Error(`Overpass API returned HTTP ${res.status}. Try again in ~30 seconds.`);
  }

  let finalData = null;
  const parseStream = createParseStream();
  Readable.fromWeb(res.body).pipe(parseStream);

  parseStream.on('data', (data) => {
    finalData = data;
  });

  await new Promise((resolve, reject) => {
    parseStream.on('end', resolve);
    parseStream.on('error', reject);
  });

  return finalData;
}

/**
 * Resolve a human-readable street name from OSM tags.
 */
export function getStreetName(tags, preferLocale = 'en') {
  if (tags.noname === 'yes') return '';
  const localized = tags[`name:${preferLocale}`];
  if (localized?.trim()) return localized.trim();
  if (tags.name?.trim()) return tags.name.trim();
  if (tags.ref?.trim()) return tags.ref.trim();
  return '';
}

/**
 * Convert a standard [minLon, minLat, maxLon, maxLat] bbox
 * to the Overpass API format [minLat, minLon, maxLat, maxLon].
 */
export function toOverpassBbox(bbox) {
  return [bbox[1], bbox[0], bbox[3], bbox[2]];
}
