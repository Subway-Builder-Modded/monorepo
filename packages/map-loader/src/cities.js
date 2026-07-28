// City registration logic for the app-bundled mapLoader mod.

import { formatPopulation } from "./utils.js";

// registerCities invokes the game's API to register each modded city, and sets up the tile URLs and data file settings the game needs to properly load custom maps.
export async function registerCities(config, api, baseURL) {
  await Promise.all(
    config.places.map(async (place) => {
      const tilesURL = baseURL + "/" + place.code + "/{z}/{x}/{y}.mvt";
      const mapImageURL = baseURL + "/thumbnails/" + place.code + ".svg";
      const newPlace = {
        code: place.code,
        name: place.name,
        description: place.description,
        mapImageUrl: mapImageURL,
      };

      // Population renders on the city select screen; omit it entirely when
      // the map's config does not carry a usable value.
      const population = formatPopulation(place.population);
      if (population !== null) {
        newPlace.population = population;
      }

      // Difficulty badge, sourced from the map's registry manifest. Optional.
      if (place.difficulty) {
        newPlace.difficulty = place.difficulty;
      }

      // If the map's config reveals an initial view state, use it; otherwise, calculate a default view state based on the bounding box.
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

      // Conditionally set the min and max zoom levels for the in-game maplibregl instance if the map's config specifies them; otherwise, use default values.
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

      // Register the city via the API.
      await api.registerCity(newPlace);
      api.map.setDefaultLayerVisibility(place.code, {
        oceanFoundations: place.hasOceanDepth ? true : false,
        trackElevations: false,
      });

      const dataFiles = {
        buildingsIndex: "/data/" + place.code + `/${place.buildingsIndexFile}`,
        demandData: "/data/" + place.code + "/demand_data.json",
        roads: "/data/" + place.code + "/roads.geojson",
        runwaysTaxiways: "/data/" + place.code + "/runways_taxiways.geojson",
      };

      // If the map was packaged with ocean depth data, add the ocean depth index file to the data files.
      if (place.hasOceanDepth) {
        dataFiles.oceanDepthIndex =
          "/data/" + place.code + "/ocean_depth_index.json";
      }

      let foundationsTileURL = tilesURL;

      // If the map was packaged with separate foundation tiles, override the default tile URL with the foundations tile URL.
      if (place.hasFoundationTiles) {
        foundationsTileURL =
          baseURL + "/" + place.code + "_foundations/{z}/{x}/{y}.mvt";
      }

      api.map.setTileURLOverride({
        cityCode: place.code,
        tilesUrl: tilesURL,
        foundationTilesUrl: foundationsTileURL,
        maxZoom: config.tileZoomLevel,
      });

      api.cities.setCityDataFiles(place.code, dataFiles);
    }),
  );
}
