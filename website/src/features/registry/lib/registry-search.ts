import Fuse from "fuse.js";
import { buildCountryCodeSearchTerms } from "@subway-builder-modded/asset-listings-state";
import type { RegistrySearchItem } from "./registry-search-types";

export type RegistrySearchValue = string | null | undefined;

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase();
}

export function buildRegistryCountrySearchValues(countryCode: RegistrySearchValue): string[] {
  return buildCountryCodeSearchTerms(countryCode);
}

export function buildRegistrySearchText(values: RegistrySearchValue[]): string {
  return normalizeSearchText(values.filter(Boolean).join(" "));
}

/**
 * Fuse extended-search options tuned to behave like the previous exact
 * substring matcher for plain tokens (threshold 0, location-free) while
 * unlocking the operator grammar: space = AND, `|` = OR, `!term` = must not
 * contain, `^term` = starts-with, `term$` = ends-with, `=term` = exact.
 * The `^`/`$`/`=` anchors apply to the item's combined search text, which
 * begins with its display name.
 */
const REGISTRY_SEARCH_FUSE_OPTIONS = {
  keys: ["text"],
  useExtendedSearch: true,
  ignoreLocation: true,
  threshold: 0,
};

const fuseBySearchText = new Map<string, Fuse<{ text: string }>>();
const FUSE_CACHE_LIMIT = 4000;

function getFuseForSearchText(searchText: string): Fuse<{ text: string }> {
  const cached = fuseBySearchText.get(searchText);
  if (cached) {
    return cached;
  }
  if (fuseBySearchText.size >= FUSE_CACHE_LIMIT) {
    fuseBySearchText.clear();
  }
  const fuse = new Fuse([{ text: searchText }], REGISTRY_SEARCH_FUSE_OPTIONS);
  fuseBySearchText.set(searchText, fuse);
  return fuse;
}

/** Drops operator tokens left dangling mid-typing (`kronifer |`, `!`). */
function sanitizeExtendedQuery(query: string): string {
  const tokens = query.split(/\s+/).filter(Boolean);
  while (tokens.length > 0 && /^[|!^='$]+$/.test(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  while (tokens.length > 0 && tokens[0] === "|") {
    tokens.shift();
  }
  return tokens.join(" ");
}

/**
 * Matches an item's search values against a Fuse extended-search query:
 * `kronifer | slurry` matches either author; `yukina- !cz` matches items
 * containing "yukina-" and not containing "cz". Plain tokens behave as exact
 * substrings (diacritic- and case-insensitive), matching the pre-Fuse
 * behavior.
 */
export function matchesRegistrySearch(values: RegistrySearchValue[], query: string): boolean {
  const sanitized = sanitizeExtendedQuery(normalizeSearchText(query));
  if (!sanitized) {
    return true;
  }

  const searchText = buildRegistrySearchText(values);
  return getFuseForSearchText(searchText).search(sanitized).length > 0;
}

export function buildRegistryItemSearchValues(item: RegistrySearchItem): string[] {
  return [
    item.name,
    item.id,
    item.author,
    item.authorId ?? "",
    item.projectId ?? "",
    ...item.tags,
    ...(item.searchAliases ?? []),
    item.cityCode ?? "",
    item.countryCode ?? "",
    item.countryName ?? "",
    ...buildRegistryCountrySearchValues(item.countryCode),
  ].filter(Boolean);
}
