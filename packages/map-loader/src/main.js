// Entry point for the Railyard map loader mod.
//
// This module is bundled by esbuild into a single self-contained IIFE and
// embedded by the Go backend.
//
// `$CONFIG` is a placeholder token the Go backend replaces with the rendered
// mod config JSON at install time.
import { installDrivingPathServer } from "./driving-path.js";
import { registerCities } from "./cities.js";
import { registerCountryTabs } from "./tabs.js";
import { createLayerManager } from "./layers.js";

const config = $CONFIG;
const baseURL = "http://127.0.0.1:" + config.port;
const api = window.SubwayBuilderAPI;

// Railyard's user-facing app version, injected by the Go backend at mod
// generation time. Sourced from the same version.txt that drives the app + the mod manifest.
const MOD_VERSION = "$MOD_VERSION";

(async () => {
  console.log(
    `[mapLoader] Railyard v${MOD_VERSION} — registering ${config.places.length} map(s)`,
  );

  // A driving-path bug must never stop the maps from registering below.
  try {
    installDrivingPathServer(config);
  } catch (e) {
    console.error("[mapLoader] driving path server failed to install", e);
  }

  await registerCities(config, api, baseURL);

  registerCountryTabs(config.places, api);

  // Custom layer management: holds the current-city/map state shared between
  // the city-load and map-ready hooks.
  const layers = createLayerManager(config, api);
  api.hooks.onCityLoad(layers.handleCityLoad);
  api.hooks.onMapReady(layers.handleMapReady);
})();
