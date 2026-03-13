import { useMemo, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { types } from "../../wailsjs/go/models";
import { type PerPage } from "../lib/constants";
import { FUSE_SEARCH_OPTIONS } from "@/lib/search";
import { useProfileStore } from "@/stores/profile-store";
import { useLibraryStore } from "@/stores/library-store";
import {
  buildSearchText,
  compareItems,
  matchesMapAttributeFilters,
  sortItemsBySeed,
  type SearchFilterState,
  type TaggedItem,
} from "@/hooks/use-filtered-items";

export type InstalledTaggedItem =
  | {
      type: "mod";
      item: types.ModManifest;
      installedVersion: string;
    }
  | {
      type: "map";
      item: types.MapManifest;
      installedVersion: string;
    };

interface UseFilteredInstalledParams {
  items: InstalledTaggedItem[];
  modDownloadTotals: Record<string, number>;
  mapDownloadTotals: Record<string, number>;
}

type SearchableItem = {
  entry: InstalledTaggedItem;
  searchText: string;
};

export function useFilteredInstalledItems({
  items,
  modDownloadTotals,
  mapDownloadTotals,
}: UseFilteredInstalledParams) {
  const defaultPerPage = useProfileStore((s) => s.defaultPerPage)() as PerPage;
  const filters = useLibraryStore((s) => s.filters);
  const setFilters = useLibraryStore((s) => s.setFilters);
  const page = useLibraryStore((s) => s.page);
  const setPage = useLibraryStore((s) => s.setPage);

  useEffect(() => {
    setFilters((prev) =>
      prev.perPage === defaultPerPage ? prev : { ...prev, perPage: defaultPerPage },
    );
  }, [defaultPerPage, setFilters]);

  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setPage(1);
  }, [filters, setPage]);

  const filtered = useMemo(() => {
    let result = [...items];

    result = result.filter((i) => i.type === filters.type);

    if (filters.type === "mod" && filters.mod.tags.length > 0) {
      result = result.filter((i) =>
        i.type === "mod"
          ? (i.item.tags ?? []).some((tag) => filters.mod.tags.includes(tag))
          : true,
      );
    }

    result = result.filter((i) =>
      matchesMapAttributeFilters(i as TaggedItem, filters.map as SearchFilterState["map"]),
    );

    const query = filters.query.trim();
    if (query) {
      const searchable: SearchableItem[] = result.map((entry) => ({
        entry,
        searchText: buildSearchText(entry as TaggedItem),
      }));
      const fuse = new Fuse(searchable, FUSE_SEARCH_OPTIONS);
      result = fuse.search(query).map((r: { item: SearchableItem }) => r.item.entry);
    }

    if (filters.sort.field === "random") {
      return sortItemsBySeed(result as TaggedItem[], filters.randomSeed) as InstalledTaggedItem[];
    }

    return result.sort((a, b) =>
      compareItems(
        a as TaggedItem,
        b as TaggedItem,
        filters.sort,
        modDownloadTotals,
        mapDownloadTotals,
      ),
    );
  }, [items, filters, mapDownloadTotals, modDownloadTotals]);

  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / filters.perPage));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * filters.perPage;
    return filtered.slice(start, start + filters.perPage);
  }, [filtered, page, filters.perPage]);

  return {
    items: paginatedItems,
    allFilteredItems: filtered,
    page,
    totalPages,
    totalResults,
    filters,
    setFilters,
    setPage,
  };
}
