const config = $CONFIG;
const baseURL = "http://127.0.0.1:" + config.port;

// Nuisance layers that bleed through the rendered background tile layers (e.g. parks, airports, water) and should be removed for visual clarity
const nuisanceLayersToRemove = [
  "world-land",
  "world-borders",
  "city-markers-dot",
  "city-markers-label",
];

function getFlagEmoji(countryCode) {
  let codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function capitalizeString(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function semverCompare(v1, v2) {
  const v1Parts = v1.split(".").map(Number);
  const v2Parts = v2.split(".").map(Number);
  if (v1Parts[0] > v2Parts[0]) return true;
  if (v1Parts[0] == v2Parts[0] && v1Parts[1] > v2Parts[1]) return true;
  if (
    v1Parts[0] == v2Parts[0] &&
    v1Parts[1] == v2Parts[1] &&
    v1Parts[2] > v2Parts[2]
  )
    return true;
  return false;
}

function getCountryName(countryCode) {
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  return regionNames.of(countryCode.toUpperCase());
}

function generateTabs(places) {
  let tabs = {};
  places.forEach((place) => {
    if (place.country === undefined || place.country.toUpperCase() === "US") {
      // don't make tabs for these, we will have to do these on an upcoming update
      return;
    }
    if (tabs.hasOwnProperty(place.country)) {
      tabs[place.country].push(place.code);
    } else {
      tabs[place.country] = [place.code];
    }
  });
  return tabs;
}

// --- Driving route paths for modded maps -----------------------------------
// Official Subway Builder cities draw a road-following driving route in the
// pop-details view; modded maps fall back to a straight home->work line even
// though their demand_data ships a full drivingPath per pop. The view fetches
// `map://paths/<cityCode>/<popId>` and expects `{ coordinates }`, and no server
// answers that for modded cities. We answer it, gated to Railyard's own maps.
const MODDED_PATH_URL = /^map:\/\/paths\/([^/]+)\/([^/]+)$/;

function parseModdedPathRequest(url) {
  const match = MODDED_PATH_URL.exec(url);
  return match ? { cityCode: match[1], popId: match[2] } : null;
}

// A drawable route needs at least two finite [lon, lat] points.
function isUsablePath(coords) {
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

function urlFromFetchInput(input) {
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
function installDrivingPathServer(config) {
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

(async () => {
  // A driving-path bug must never stop the maps from registering below.
  try {
    installDrivingPathServer(config);
  } catch (e) {
    console.error("[mapLoader] driving path server failed to install", e);
  }

  await Promise.all(
    config.places.map(async (place) => {
      const tilesURL = baseURL + "/" + place.code + "/{z}/{x}/{y}.mvt";
      const mapImageURL = baseURL + "/thumbnails/" + place.code + ".svg";
      let newPlace = {
        code: place.code,
        name: place.name,
        population: place.population,
        description: place.description,
        mapImageUrl: mapImageURL,
      };
      if (place.initialViewState) {
        newPlace.initialViewState = place.initialViewState;
      } else {
        newPlace.initialViewState = {
          longitude: (place.bbox[0] + place.bbox[2]) / 2,
          latitude: (place.bbox[1] + place.bbox[3]) / 2,
          zoom: 12,
          bearing: 0,
        };
      }
      if (place.minZoom) {
        newPlace.minZoom = place.minZoom;
      } else {
        newPlace.minZoom = 8;
      }
      if (place.maxZoom) {
        newPlace.maxZoom = place.maxZoom;
      } else {
        newPlace.maxZoom = config.tileZoomLevel;
      }
      await window.SubwayBuilderAPI.registerCity(newPlace);
      window.SubwayBuilderAPI.map.setDefaultLayerVisibility(place.code, {
        oceanFoundations: place.hasOceanDepth ? true : false,
        trackElevations: false,
      });

      let dataFiles = {
        buildingsIndex: "/data/" + place.code + `/${place.buildingsIndexFile}`,
        demandData: "/data/" + place.code + "/demand_data.json",
        roads: "/data/" + place.code + "/roads.geojson",
        runwaysTaxiways: "/data/" + place.code + "/runways_taxiways.geojson",
      };

      if (place.hasOceanDepth) {
        dataFiles.oceanDepthIndex =
          "/data/" + place.code + "/ocean_depth_index.json";
      }

      let foundationsTileURL = tilesURL;

      if (place.hasFoundationTiles) {
        foundationsTileURL = baseURL + "/" + place.code + "_foundations/{z}/{x}/{y}.mvt";
      }

      window.SubwayBuilderAPI.map.setTileURLOverride({
        cityCode: place.code,
        tilesUrl: tilesURL,
        foundationTilesUrl: foundationsTileURL,
        maxZoom: config.tileZoomLevel,
      });

      window.SubwayBuilderAPI.cities.setCityDataFiles(place.code, dataFiles);
    }),
  );

  const tabs = generateTabs(config.places);
  Object.entries(tabs).forEach(([country, codes]) => {
    console.log("Registering tab for country:", country, "with codes:", codes);
    window.SubwayBuilderAPI.cities.registerTab({
      id: country,
      label: getCountryName(country),
      emoji: getFlagEmoji(country),
      cityCodes: codes,
    });
  });

  // Store current loaded game state (map + city code) for use in custom layer management
  let currentCityCode = null;
  let mapRef = null;

  function removeVanillaParkLayers(map) {
    if (map.getLayer("parks-large")) {
      map.removeLayer("parks-large");
    }
    if (map.getLayer("parks-small")) {
      map.removeLayer("parks-small");
    }
  }
  function removeVanillaAirportLayers(map) {
    if (map.getLayer("airports")) {
      map.removeLayer("airports");
    }
  }

  function addCustomLayers(map) {
    // Do not add custom layers if the current city is not managed by Railyard
    if (!config.places.some((p) => p.code === currentCityCode)) {
      return;
    }

    let colorsData = JSON.parse(
      window.localStorage.getItem("map_custom_colors"),
    );
    let currentTheme = window.SubwayBuilderAPI.ui
      .getResolvedTheme()
      .toUpperCase();
    let themeObject = `custom${capitalizeString(currentTheme)}Colors`;
    let colorToUsePark;
    let colorToUseAirport;

    // Best source: from API, doesn't rely on potentially unpopulated localstorage
    if (SubwayBuilderAPI.gameState && SubwayBuilderAPI.gameState.getMapColors) {
      const mapColors = SubwayBuilderAPI.gameState.getMapColors();
      colorToUsePark = mapColors.parks;
      colorToUseAirport = mapColors.airports;
    // Next best source: from localStorage if game version is above v1.3.0 (should always be populated)
    } else if (config.gameVersion && semverCompare(config.gameVersion, "1.3.0")) {
      colorToUsePark =
        colorsData[themeObject]?.parks ?? config.colors[currentTheme].PARK;
      colorToUseAirport =
        colorsData[themeObject]?.airports ?? config.colors[currentTheme].AIRPORT;
    // pre v1.4.0 when custom colors were optional
    } else if (colorsData.useCustomColors) {
      colorToUsePark = colorsData[themeObject]?.parks
        ? colorsData[themeObject].parks
        : config.colors[currentTheme].PARK;
      colorToUseAirport = colorsData[themeObject]?.airports
        ? colorsData[themeObject].airports
        : config.colors[currentTheme].AIRPORT;
    // Fall back to old default colors if everything else fails
    } else {
      colorToUsePark = config.colors[currentTheme].PARK;
      colorToUseAirport = config.colors[currentTheme].AIRPORT;
    }

    function isFoundationsVisible(map) {
      const layers = map.getStyle().layers;
      for (let layer of layers) {
        if (
          layer.id === "building-foundations" &&
          map.getLayoutProperty(layer.id, "visibility") === "visible"
        ) {
          return true;
        }
      }
      return false;
    }

    if (!map.getLayer("parks-modded")) {
      map.addLayer(
        {
          id: "parks-modded",
          type: "fill-extrusion",
          source: "general-tiles",
          "source-layer": "landuse",
          filter: ["==", ["get", "kind"], "park"],
          paint: {
            "fill-extrusion-color": colorToUsePark,
            "fill-extrusion-height": 0,
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.8,
          },
          layout: {
            visibility: isFoundationsVisible(map) ? "none" : "visible",
          },
        },
        "general-tiles",
      );
      removeVanillaParkLayers(map);
    }

    if (!map.getLayer("airports-modded")) {
      map.addLayer(
        {
          id: "airports-modded",
          type: "fill-extrusion",
          source: "general-tiles",
          "source-layer": "landuse",
          filter: ["==", ["get", "kind"], "aerodrome"],
          paint: {
            "fill-extrusion-color": colorToUseAirport,
            "fill-extrusion-height": 0,
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 1,
          },
          layout: {
            visibility: isFoundationsVisible(map) ? "none" : "visible",
          },
        },
        "general-tiles",
      );
      removeVanillaAirportLayers(map);
    }

    // Remove nuisance vanilla layers
    for (const layerId of nuisanceLayersToRemove) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    }
  }

  window.SubwayBuilderAPI.hooks.onCityLoad((cityCode) => {
    currentCityCode = cityCode;
    // If map is already ready, add custom layers now that we know the city code
    if (mapRef) {
      addCustomLayers(mapRef);
    }
    if (semverCompare(config.gameVersion, "1.3.6")) {
      window.SubwayBuilderAPI.actions.setDemandBubbleScale(1.0);
      if (
        config.places.find((place) => place.code === cityCode)?.demandDotScaling
      ) {
        const scaling = config.places.find(
          (place) => place.code === cityCode,
        )?.demandDotScaling;
        window.SubwayBuilderAPI.actions.setDemandBubbleScale(scaling);
      }
    }
  });

  window.SubwayBuilderAPI.hooks.onMapReady((map) => {
    mapRef = map ?? api.utils.getMap();
    const resolvedMap = mapRef;

    if (
      semverCompare(config.gameVersion, "1.3.6") &&
      config.places.some((place) => place.demandDotScaling)
    ) {
      const scaling = config.places.find(
        (place) => place.demandDotScaling,
      )?.demandDotScaling;
      SubwayBuilderAPI.actions.setDemandBubbleScale(scaling);
    }

    // Call immediately so layers are inserted on first load
    addCustomLayers(resolvedMap);
    resolvedMap.on("styledata", () => addCustomLayers(resolvedMap));
  });
})();
