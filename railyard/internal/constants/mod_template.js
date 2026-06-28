const config = $CONFIG;
const baseURL = "http://127.0.0.1:" + config.port;
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

function getCountryName(countryCode) {
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  return regionNames.of(countryCode.toUpperCase());
}

function generateTabs(places) {
  let tabs = {};
  places.forEach((place) => {
    if (
      place.country === undefined
      || place.country.toUpperCase() === "US"
    ) {
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
      }

      if (place.hasOceanDepth) {
        dataFiles.oceanDepthIndex = "/data/" + place.code + "/ocean_depth_index.json";
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

  function addCustomLayers(map) {
    let colorsData = JSON.parse(window.localStorage.getItem("map_custom_colors"));
    let currentTheme = window.SubwayBuilderAPI.ui.getResolvedTheme().toUpperCase();
    let themeObject = `custom${capitalizeString(currentTheme)}Colors`;
    let colorToUsePark = colorsData[themeObject].parks;
    let colorToUseAirport = colorsData[themeObject].airports;

    function isFoundationsVisible(map) {
      const layers = map.getStyle().layers;
      for (let layer of layers) {
        if (layer.id === "building-foundations" && map.getLayoutProperty(layer.id, "visibility") === "visible") {
          return true;
        }
      }
      return false;
    }

    if (!map.getLayer("parks-modded")) {
      map.addLayer({
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
        }
      });
    }

    if (!map.getLayer("airports-modded")) {
      map.addLayer({
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
        }
      })
    }
  }

  window.SubwayBuilderAPI.hooks.onMapReady((map) => {
    const resolvedMap = map ?? api.utils.getMap();
    resolvedMap.on("styledata", () => addCustomLayers(resolvedMap));
    resolvedMap.on("data", () => addCustomLayers(resolvedMap));
    resolvedMap.on("load", () => addCustomLayers(resolvedMap));
  });
})()
