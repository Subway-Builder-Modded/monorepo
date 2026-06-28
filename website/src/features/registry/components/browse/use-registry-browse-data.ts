import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { collectTags, filterRegistryItems } from "@/features/registry/lib/filter-registry-items";
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

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [tid, items] of Object.entries(allItemsByType)) {
      result[tid] = items.length;
    }
    return result;
  }, [allItemsByType]);

  const availableTags = useMemo(() => collectTags(typeItems), [typeItems]);

  const filteredItems = useMemo(
    () => filterRegistryItems(typeItems, deferredQuery, selectedTags),
    [typeItems, deferredQuery, selectedTags],
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
    sortedItems,
    totalPages,
    visibleItems,
    handleReshuffle,
  };
}
