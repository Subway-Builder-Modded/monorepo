// Country tab registration. Groups custom maps by country and registers a
// tab per country with the game's city API.
import { getCountryName, getFlagEmoji } from "./utils.js";

export function generateTabs(places) {
  const tabs = {};
  places.forEach((place) => {
    // US and country-less places are skipped for now.
    if (place.country === undefined || place.country.toUpperCase() === "US") {
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

// Register a country tab per grouped country, in alphabetical order of the
// displayed country name so the tab bar reads A->Z regardless of the order
// custom maps appear in the config.
export function registerCountryTabs(places, api) {
  const tabs = generateTabs(places);
  Object.entries(tabs)
    .map(([country, cityCodes]) => ({
      id: country,
      label: getCountryName(country),
      emoji: getFlagEmoji(country),
      cityCodes,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .forEach((tab) => {
      console.log(
        "Registering tab for country:",
        tab.id,
        "with codes:",
        tab.cityCodes,
      );
      api.cities.registerTab(tab);
    });
}
