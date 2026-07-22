// Custom map layer management for Railyard maps: swaps the vanilla park/airport
// layers for Railyard-managed layers using the resolved theme colors, and
// removes nuisance vanilla layers that bleed through into the rendered simulation.
import { capitalizeString, semverCompare } from "./utils.js";

// Nuisance layers that bleed through the rendered background tile layers (e.g.
// parks, airports, water) and should be removed for visual clarity.
const nuisanceLayersToRemove = [
  "world-land",
  "world-borders",
  "city-markers-dot",
  "city-markers-label",
];

// Creates a layer manager bound to a config + game API. Holds the mutable
// current-city / map references that the city-load and map-ready hooks share.
export function createLayerManager(config, api) {
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

  function isFoundationsVisible(map) {
    const layers = map.getStyle().layers;
    for (const layer of layers) {
      if (
        layer.id === "building-foundations" &&
        map.getLayoutProperty(layer.id, "visibility") === "visible"
      ) {
        return true;
      }
    }
    return false;
  }

  function addCustomLayers(map) {
    // Do not add custom layers if the current city is not managed by Railyard
    if (!config.places.some((p) => p.code === currentCityCode)) {
      return;
    }

    const colorsData = JSON.parse(
      window.localStorage.getItem("map_custom_colors"),
    );
    const currentTheme = api.ui.getResolvedTheme().toUpperCase();
    const themeObject = `custom${capitalizeString(currentTheme)}Colors`;
    let colorToUsePark;
    let colorToUseAirport;

    // Best source: from API, doesn't rely on potentially unpopulated localstorage
    if (api.gameState && api.gameState.getMapColors) {
      const mapColors = api.gameState.getMapColors();
      colorToUsePark = mapColors.parks;
      colorToUseAirport = mapColors.airports;
      // Next best source: from localStorage if game version is above v1.3.0 (should always be populated)
    } else if (
      config.gameVersion &&
      semverCompare(config.gameVersion, "1.3.0")
    ) {
      colorToUsePark =
        colorsData[themeObject]?.parks ?? config.colors[currentTheme].PARK;
      colorToUseAirport =
        colorsData[themeObject]?.airports ??
        config.colors[currentTheme].AIRPORT;
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

  // Handler for the game's onCityLoad hook.
  function handleCityLoad(cityCode) {
    currentCityCode = cityCode;
    // If map is already ready, add custom layers now that we know the city code
    if (mapRef) {
      addCustomLayers(mapRef);
    }
    if (semverCompare(config.gameVersion, "1.3.6")) {
      api.actions.setDemandBubbleScale(1.0);
      const scaling = config.places.find(
        (place) => place.code === cityCode,
      )?.demandDotScaling;
      if (scaling) {
        api.actions.setDemandBubbleScale(scaling);
      }
    }
  }

  // Handler for the game's onMapReady hook.
  function handleMapReady(map) {
    mapRef = map ?? api.utils.getMap();
    const resolvedMap = mapRef;

    if (
      semverCompare(config.gameVersion, "1.3.6") &&
      config.places.some((place) => place.demandDotScaling)
    ) {
      const scaling = config.places.find(
        (place) => place.demandDotScaling,
      )?.demandDotScaling;
      api.actions.setDemandBubbleScale(scaling);
    }

    // Call immediately so layers are inserted on first load
    addCustomLayers(resolvedMap);
    resolvedMap.on("styledata", () => addCustomLayers(resolvedMap));
  }

  return { handleCityLoad, handleMapReady, addCustomLayers };
}
