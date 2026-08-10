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

export function urlFromFetchInput(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return (input && input.url) || "";
}

// Install a one-time window.fetch shim that answers driving-path requests for
// Railyard maps. Re-running the mod (a reload) swaps the config, not the shim.
export function installDrivingPathServer(config) {
  const moddedCodes = new Set((config.places || []).map((p) => p.code));

  const pathServerURL = `http://127.0.0.1:${config.drivingPathPort}/path?cityCode={cityCode}&popId={popId}`;
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = function drivingPathFetchShim(input, init) {
    const request = parseModdedPathRequest(urlFromFetchInput(input));

    if (request && moddedCodes.has(request.cityCode)) {
      const forwardedURL = pathServerURL
        .replace("{cityCode}", encodeURIComponent(request.cityCode))
        .replace("{popId}", encodeURIComponent(request.popId));

      return originalFetch(forwardedURL, init);
    }

    return originalFetch(input, init);
  };
}
