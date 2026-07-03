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

export function matchesRegistrySearch(values: RegistrySearchValue[], query: string): boolean {
  const normalizedTerms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (normalizedTerms.length === 0) {
    return true;
  }

  const searchText = buildRegistrySearchText(values);
  return normalizedTerms.every((term) => searchText.includes(term));
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
