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

(async () => {
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
        oceanFoundations: false,
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

      window.SubwayBuilderAPI.map.setTileURLOverride({
        cityCode: place.code,
        tilesUrl: tilesURL,
        foundationTilesUrl: tilesURL,
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
    let colorsData = JSON.parse(
      window.localStorage.getItem("map_custom_colors"),
    );
    let currentTheme = window.SubwayBuilderAPI.ui
      .getResolvedTheme()
      .toUpperCase();
    let themeObject = `custom${capitalizeString(currentTheme)}Colors`;
    let colorToUsePark;
    let colorToUseAirport;

    if (colorsData.useCustomColors) {
      colorToUsePark = colorsData[themeObject]?.parks
        ? colorsData[themeObject].parks
        : config.colors[currentTheme].PARK;
      colorToUseAirport = colorsData[themeObject]?.airports
        ? colorsData[themeObject].airports
        : config.colors[currentTheme].AIRPORT;
    } else {
      colorToUsePark = config.colors[currentTheme].PARK;
      colorToUseAirport = config.colors[currentTheme].AIRPORT;
    }

    if (config.gameVersion && semverCompare(config.gameVersion, "1.3.0")) {
      colorToUsePark = colorsData[themeObject].parks;
      colorToUseAirport = colorsData[themeObject].airports;
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
    const resolvedMap = map ?? api.utils.getMap();

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
