import { useEffect, useCallback, useState, useMemo } from "react";
import { SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { RegistryHero } from "./components/registry-hero";
import { RegistryBrowseSection } from "./components/registry-browse-section";
import { RegistrySpotlightSearch } from "./components/registry-spotlight-search";
import { useRegistryParams } from "./lib/use-registry-params";
import { loadRegistryItemsForType } from "./lib/load-registry-cache";
import { REGISTRY_TYPES } from "./registry-type-config";
import type { RegistrySearchItem } from "./lib/registry-search-types";
import type { RegistrySortId, RegistryViewMode } from "./lib/types";

export function RegistryPage() {
  const suite = getSuiteById("registry");
  const { params, setParams } = useRegistryParams();
  const [queryInput, setQueryInput] = useState(params.query);
  const [isHeroInView, setIsHeroInView] = useState(true);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [allItemsByType, setAllItemsByType] = useState<Record<string, RegistrySearchItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setQueryInput(params.query);
  }, [params.query]);

  useEffect(() => {
    const hero = document.getElementById("registry-hero");
    if (!hero) return;

    const updateHeroVisibility = () => {
      const heroBottom = hero.getBoundingClientRect().bottom;
      // Toolbar is fixed bottom-4 (~16px) and ~56px tall, so its top is at
      // window.innerHeight - 74px. Show it only once the hero clears that line.
      const toolbarTop = window.innerHeight - 74;
      setIsHeroInView(heroBottom > toolbarTop);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersects = entry?.isIntersecting ?? false;
        if (!intersects) {
          setIsHeroInView(false);
          return;
        }
        updateHeroVisibility();
      },
      { threshold: 0.15 },
    );

    observer.observe(hero);
    updateHeroVisibility();
    window.addEventListener("scroll", updateHeroVisibility, { passive: true });
    window.addEventListener("resize", updateHeroVisibility);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateHeroVisibility);
      window.removeEventListener("resize", updateHeroVisibility);
    };
  }, []);

  useEffect(() => {
    function handleGlobalShortcut(event: KeyboardEvent) {
      if (isHeroInView) return;

      const isMac = navigator.platform.toLowerCase().includes("mac");
      const hasSearchModifier = isMac ? event.metaKey : event.ctrlKey;
      if (!hasSearchModifier) return;
      if (event.key.toLowerCase() !== "m") return;

      event.preventDefault();
      setIsSpotlightOpen(true);
    }

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, [isHeroInView]);

  useEffect(() => {
    if (queryInput === params.query) return;
    const timeoutId = window.setTimeout(() => {
      setParams({ query: queryInput });
    }, 180);
    return () => window.clearTimeout(timeoutId);
  }, [queryInput, params.query, setParams]);

  // Load all registry types on mount
  useEffect(() => {
    setIsLoading(true);

    Promise.all(
      REGISTRY_TYPES.map(async (type) => {
        const items = await loadRegistryItemsForType(type.id, type.routeSegment);
        return [type.id, items] as const;
      }),
    )
      .then((entries) => {
        setAllItemsByType(Object.fromEntries(entries));
      })
      .catch(() => {
        setAllItemsByType({});
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [tid, items] of Object.entries(allItemsByType)) {
      result[tid] = items.length;
    }
    return result;
  }, [allItemsByType]);

  // Scroll to browse section
  const scrollToBrowse = useCallback(() => {
    const el = document.getElementById("registry-browse");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Param setters
  const handleQueryChange = useCallback((q: string) => setQueryInput(q), []);

  const handleTypeChange = useCallback((id: string) => setParams({ typeId: id }), [setParams]);

  const handleTagToggle = useCallback(
    (tag: string) => {
      const next = params.tags.includes(tag)
        ? params.tags.filter((t) => t !== tag)
        : [...params.tags, tag];
      setParams({ tags: next });
    },
    [params.tags, setParams],
  );

  const handleTagsClear = useCallback(() => setParams({ tags: [] }), [setParams]);

  const handleSortChange = useCallback(
    (id: RegistrySortId) => setParams({ sortId: id }),
    [setParams],
  );

  const handleDirToggle = useCallback(
    () => setParams({ sortDir: params.sortDir === "asc" ? "desc" : "asc" }),
    [params.sortDir, setParams],
  );

  const handleViewChange = useCallback(
    (mode: RegistryViewMode) => setParams({ viewMode: mode }),
    [setParams],
  );

  const openSpotlight = useCallback(() => {
    setIsSpotlightOpen(true);
  }, []);

  const closeSpotlight = useCallback(() => {
    setIsSpotlightOpen(false);
  }, []);

  return (
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <RegistryHero
        query={queryInput}
        typeId={params.typeId}
        counts={counts}
        onQueryChange={handleQueryChange}
        onTypeChange={handleTypeChange}
        onBrowse={scrollToBrowse}
        onActivateSearch={openSpotlight}
      />

      <RegistryBrowseSection
        allItemsByType={allItemsByType}
        isLoading={isLoading}
        typeId={params.typeId}
        query={queryInput}
        selectedTags={params.tags}
        sortId={params.sortId}
        sortDir={params.sortDir}
        viewMode={params.viewMode}
        onTypeChange={handleTypeChange}
        onQueryChange={handleQueryChange}
        onTagToggle={handleTagToggle}
        onTagsClear={handleTagsClear}
        onSortChange={handleSortChange}
        onDirToggle={handleDirToggle}
        onViewChange={handleViewChange}
        showFloatingSearch={!isHeroInView}
        isSearchActive={isSpotlightOpen}
        onActivateSearch={openSpotlight}
      />

      <RegistrySpotlightSearch
        isOpen={isSpotlightOpen}
        query={queryInput}
        onQueryChange={handleQueryChange}
        onClose={closeSpotlight}
      />
    </SuiteAccentScope>
  );
}
