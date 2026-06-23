const config = $CONFIG;
const baseURL = "http://127.0.0.1:" + config.port;
function getFlagEmoji(countryCode) {
  let codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function getCountryName(countryCode) {
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  return regionNames.of(countryCode.toUpperCase());
}

function generateTabs(places) {
  let tabs = {};
  places.forEach((place) => {
    if (
      place.country === undefined ||
      place.country.toUpperCase() === "US" ||
      place.country.toUpperCase() === "GB"
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
      await window.SubwayBuilderAPI.registerCity(newPlace);
      window.SubwayBuilderAPI.map.setDefaultLayerVisibility(place.code, {
        oceanFoundations: false,
        trackElevations: false,
      });
      // Fix layer schemas for custom tiles
      window.SubwayBuilderAPI.map.setLayerOverride({
        layerId: "parks-large",
        sourceLayer: "landuse",
        filter: ["==", ["get", "kind"], "park"],
      });
      window.SubwayBuilderAPI.map.setLayerOverride({
        layerId: "airports",
        sourceLayer: "landuse",
        filter: ["==", ["get", "kind"], "aerodrome"],
      });
      window.SubwayBuilderAPI.map.setTileURLOverride({
        cityCode: place.code,
        tilesUrl: tilesURL,
        foundationTilesUrl: tilesURL,
        maxZoom: config.tileZoomLevel,
      });
      window.SubwayBuilderAPI.cities.setCityDataFiles(place.code, {
        // The game API appends .gz, so we pass the stem; Railyard picks the .bin or
        // .json form per the installed game version (binary on builds > 1.3.0).
        buildingsIndex: "/data/" + place.code + "/" + place.buildingsIndexFile,
        demandData: "/data/" + place.code + "/demand_data.json", // drivingPaths supplied in demand_data.json.gz still aren't used
        roads: "/data/" + place.code + "/roads.geojson",
        runwaysTaxiways: "/data/" + place.code + "/runways_taxiways.geojson",
      });
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
})();
