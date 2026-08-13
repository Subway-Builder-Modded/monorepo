import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  collectTags,
  filterRegistryItems,
  matchesVisibility,
} from "@/features/registry/lib/filter-registry-items";
import type { RegistryVisibility } from "@/features/registry/lib/use-registry-params";
import { sortRegistryItems } from "@/features/registry/lib/sort-registry-items";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import type { RegistrySortId } from "@/features/registry/lib/types";

type UseRegistryBrowseDataProps = {
  allItemsByType: Record<string, RegistrySearchItem[]>;
  typeId: string;
  query: string;
  selectedTags: string[];
  sortId: RegistrySortId;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
  visibility: RegistryVisibility;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

export function useRegistryBrowseData({
  allItemsByType,
  typeId,
  query,
  selectedTags,
  sortId,
  sortDir,
  page,
  pageSize,
  visibility,
  isLoading,
  onPageChange,
}: UseRegistryBrowseDataProps) {
  const [randomSeed, setRandomSeed] = useState(() => Date.now());
  const preloadedThumbnailSrcs = useRef<Set<string>>(new Set());
  const deferredQuery = useDeferredValue(query);
  const onPageChangeRef = useRef(onPageChange);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  const typeItems = allItemsByType[typeId] ?? [];

  // Sidebar type counts follow the visibility class: exactly one retirement
  // class is counted at a time.
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [tid, items] of Object.entries(allItemsByType)) {
      result[tid] = items.filter((item) => matchesVisibility(item, visibility)).length;
    }
    return result;
  }, [allItemsByType, visibility]);

  const deprecatedCount = useMemo(
    () => typeItems.filter((item) => item.isDeprecated && !item.isDeleted).length,
    [typeItems],
  );

  const deletedCount = useMemo(
    () => typeItems.filter((item) => item.isDeleted).length,
    [typeItems],
  );

  const availableTags = useMemo(
    () => collectTags(typeItems.filter((item) => matchesVisibility(item, visibility))),
    [typeItems, visibility],
  );

  const filteredItems = useMemo(
    () => filterRegistryItems(typeItems, deferredQuery, selectedTags, visibility),
    [typeItems, deferredQuery, selectedTags, visibility],
  );

  const sortedItems = useMemo(
    () => sortRegistryItems(filteredItems, sortId, sortDir, randomSeed),
    [filteredItems, sortId, sortDir, randomSeed],
  );

  useEffect(() => {
    for (const item of sortedItems) {
      const src = item.thumbnailSrc;
      if (!src || preloadedThumbnailSrcs.current.has(src)) continue;

      const image = new Image();
      image.src = src;
      preloadedThumbnailSrcs.current.add(src);
    }
  }, [sortedItems]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedItems.length / pageSize)),
    [sortedItems.length, pageSize],
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (page > totalPages) {
      onPageChangeRef.current(totalPages);
    }
  }, [isLoading, page, totalPages]);

  const visibleItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedItems.slice(start, end);
  }, [sortedItems, page, pageSize]);

  const handleReshuffle = () => {
    setRandomSeed(Date.now());
  };

  return {
    typeItems,
    counts,
    availableTags,
    deprecatedCount,
    deletedCount,
    sortedItems,
    totalPages,
    visibleItems,
    handleReshuffle,
  };
}
