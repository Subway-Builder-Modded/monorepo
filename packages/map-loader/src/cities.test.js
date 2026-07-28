import { describe, expect, it } from "vitest";
import { registerCities } from "./cities.js";

// Minimal API double capturing what registerCities sends to the game.
function makeApi() {
  const registered = [];
  return {
    registered,
    registerCity: async (place) => {
      registered.push(place);
    },
    map: {
      setDefaultLayerVisibility: () => {},
      setTileURLOverride: () => {},
    },
    cities: {
      setCityDataFiles: () => {},
    },
  };
}

function makePlace(overrides = {}) {
  return {
    code: "RIX",
    name: "Riga",
    description: "Test city",
    population: 702689,
    bbox: [23.9, 56.8, 24.3, 57.1],
    buildingsIndexFile: "buildings_index",
    ...overrides,
  };
}

async function registerOne(place) {
  const api = makeApi();
  await registerCities({ places: [place], tileZoomLevel: 15 }, api, "http://127.0.0.1:8080");
  expect(api.registered).toHaveLength(1);
  return api.registered[0];
}

describe("registerCities", () => {
  it("formats population as an underscore-separated string", async () => {
    const registered = await registerOne(makePlace());
    expect(registered.population).toBe("702_689");
  });

  it("omits population when the config has no usable value", async () => {
    const registered = await registerOne(makePlace({ population: 0 }));
    expect("population" in registered).toBe(false);
  });

  it("passes the registry difficulty through when present", async () => {
    const registered = await registerOne(makePlace({ difficulty: "very_hard" }));
    expect(registered.difficulty).toBe("very_hard");
  });

  it("omits difficulty when the manifest declares none", async () => {
    const registered = await registerOne(makePlace());
    expect("difficulty" in registered).toBe(false);
  });
});
