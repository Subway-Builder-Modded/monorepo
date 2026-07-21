// Pure formatting/versioning helpers shared across the map loader.

export function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

export function capitalizeString(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Returns true when v1 is strictly greater than v2 (major.minor.patch).
export function semverCompare(v1, v2) {
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

export function getCountryName(countryCode) {
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  return regionNames.of(countryCode.toUpperCase());
}
