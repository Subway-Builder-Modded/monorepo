// --- Driving route paths for modded maps -----------------------------------
// Official Subway Builder cities draw a road-following driving route in the
// pop-details view; modded maps fall back to a straight home->work line even
// though their demand_data ships a full drivingPath per pop. The view fetches
// `map://paths/<cityCode>/<popId>` and expects `{ coordinates }`, and no server
// answers that for modded cities. We answer it, gated to Railyard's own maps.
const MODDED_PATH_URL = /^map:\/\/paths\/([^/]+)\/([^/]+)$/;

export function parseModdedPathRequest(url) {
  const match = MODDED_PATH_URL.exec(url);
  return match ? { cityCode: match[1], popId: match[2] } : null;
}

// A drawable route needs at least two finite [lon, lat] points.
export function isUsablePath(coords) {
  return (
    Array.isArray(coords) &&
    coords.length >= 2 &&
    coords.every(
      (p) =>
        Array.isArray(p) &&
        p.length >= 2 &&
        Number.isFinite(p[0]) &&
        Number.isFinite(p[1]),
    )
  );
}

export function urlFromFetchInput(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return (input && input.url) || "";
}

// Fetch + inflate a city's demand_data.json(.gz) from the game data server and
// return a Map<popId, coordinates>. Only used when the live popsMap has dropped
// drivingPath; on maps whose loaded pops retain it, this never runs.
async function loadDrivingPathsFromFile(cityCode) {
  const port =
    window.electronAPI && window.electronAPI.getDataServerPort
      ? await window.electronAPI.getDataServerPort()
      : null;
  if (!port) throw new Error("data server port unavailable");
  const base =
    "http://127.0.0.1:" + port + "/data/" + cityCode + "/demand_data.json";
  let text;
  const gz = await fetch(base + ".gz?useDownloaded=true").catch(() => null);
  if (gz && gz.ok) {
    const stream = gz.body.pipeThrough(new DecompressionStream("gzip"));
    text = await new Response(stream).text();
  } else {
    const plain = await fetch(base + "?useDownloaded=true");
    if (!plain.ok) throw new Error("demand_data fetch failed: " + plain.status);
    text = await plain.text();
  }
  const data = JSON.parse(text);
  const paths = new Map();
  const pops = data.pops || {};
  for (const id of Object.keys(pops)) {
    if (isUsablePath(pops[id].drivingPath)) paths.set(id, pops[id].drivingPath);
  }
  return paths;
}

// Install a one-time window.fetch shim that answers driving-path requests for
// Railyard maps. Re-running the mod (a reload) swaps the config, not the shim.
export function installDrivingPathServer(config) {
  const moddedCodes = new Set((config.places || []).map((p) => p.code));
  const fileCaches = new Map(); // cityCode -> Map<popId, coords>
  const fileLoads = new Map(); // cityCode -> Promise<Map>

  async function resolvePath(cityCode, popId) {
    // 1. Live demand data: zero-cost when the loaded pop keeps drivingPath.
    try {
      const dd = window.SubwayBuilderAPI.gameState.getDemandData();
      const pop = dd && dd.popsMap && dd.popsMap.get(popId);
      if (pop && isUsablePath(pop.drivingPath)) return pop.drivingPath;
    } catch (e) {
      /* fall through to the file */
    }

    // 2. Cached file map.
    const cached = fileCaches.get(cityCode);
    if (cached) return cached.get(popId) || null;

    // 3. Load the file once per city, then serve from it.
    if (!fileLoads.has(cityCode)) {
      fileLoads.set(
        cityCode,
        loadDrivingPathsFromFile(cityCode)
          .then((map) => {
            fileCaches.set(cityCode, map);
            return map;
          })
          .catch(() => {
            // Do not negative-cache. A transient failure (e.g. the data server not
            // up yet on the first pop click) must not disable routes for the city
            // for the whole session - drop the load so a later request retries.
            fileLoads.delete(cityCode);
            return new Map();
          }),
      );
    }
    const map = await fileLoads.get(cityCode);
    return map.get(popId) || null;
  }

  const existing = window.fetch;
  if (existing && existing.__railyardPathShim) {
    existing.__railyardResolve = resolvePath;
    existing.__railyardCodes = moddedCodes;
    return;
  }

  const realFetch = existing.bind(window);
  const shim = async function (input, init) {
    const request = parseModdedPathRequest(urlFromFetchInput(input));
    if (!request || !shim.__railyardCodes.has(request.cityCode)) {
      return realFetch(input, init);
    }
    // Resolve from our own data and answer directly. We deliberately do NOT probe
    // the real map:// endpoint first: modded cities have no path server, so that
    // request always 404s, and the browser logs every failed GET to the console
    // even though we serve the route right after. A miss returns a synthetic 404
    // (constructed here, no network request) - the same straight-line fallback the
    // view already handles, but without the console noise.
    let coordinates = null;
    try {
      coordinates = await shim.__railyardResolve(
        request.cityCode,
        request.popId,
      );
    } catch (e) {
      /* never let a routing error break the page fetch */
    }

    if (!isUsablePath(coordinates)) {
      return new Response("", { status: 404 });
    }
    return new Response(JSON.stringify({ coordinates }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  shim.__railyardPathShim = true;
  shim.__railyardResolve = resolvePath;
  shim.__railyardCodes = moddedCodes;
  window.fetch = shim;
}
