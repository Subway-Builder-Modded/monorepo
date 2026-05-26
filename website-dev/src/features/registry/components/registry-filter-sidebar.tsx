import {
  buildRegistryTagCategories,
  buildRegistryTagCounts,
  formatRegistryTagLabel,
  type RegistryTagCategory,
  type RegistryTagCategoryId,
} from "@subway-builder-modded/config";
import {
  ScrollArea,
  SideRailDivider,
  SideRailHeader,
  SideRailShell,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@subway-builder-modded/shared-ui";
import { useMemo, useEffect, useCallback, useRef, useState, type ReactNode } from "react";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import { RegistryTypeCountBadge } from "@/features/registry/components/registry-type-count-badge";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import {
  Map as MapIcon,
  Package,
  Tags,
  Layers3,
  GraduationCap,
  Globe2,
  ShieldCheck,
  PanelLeftOpen,
  PanelLeftClose,
  Trash2,
  ChevronRight,
  ArrowUpToLine,
} from "lucide-react";

const REGISTRY_SIDEBAR_COLLAPSED_KEY = "sbm:registry-sidebar-collapsed";
const REGISTRY_TAG_CATEGORY_STATE_KEY = "sbm:registry-tag-categories-collapsed";
const SIDEBAR_LAYOUT_SHIFT_MS = 200;
const SIDEBAR_SCROLL_HEIGHT_OFFSET_PX = 192;

type RegistryFilterSidebarProps = {
  typeId: string;
  typeItems: RegistrySearchItem[];
  counts?: Record<string, number>;
  onTypeChange: (typeId: string) => void;
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onTagsClear: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
};

type TagCategory = {
  id: RegistryTagCategoryId;
  label: string;
  icon: typeof Tags;
  tags: string[];
  defaultCollapsed?: boolean;
};

type RegistryTagCategorySectionProps = {
  category: TagCategory;
  selectedTags: string[];
  tagCounts: Record<string, number>;
  onTagToggle: (tag: string) => void;
  isCollapsed: boolean;
  onToggleCategory: (categoryId: string) => void;
};

const CATEGORY_ICON_BY_ID: Record<RegistryTagCategoryId, typeof Tags> = {
  regions: Globe2,
  "data-quality": ShieldCheck,
  "level-of-detail": Layers3,
  "special-demand": GraduationCap,
  content: Layers3,
  other: Tags,
};

function buildTagCategories(
  typeId: string,
  availableTags: string[],
  typeItems: RegistrySearchItem[],
): TagCategory[] {
  const mapManifests = typeItems
    .map((item) => item.manifest)
    .filter((manifest): manifest is Record<string, unknown> =>
      Boolean(manifest && typeof manifest === "object"),
    );
  const sourceQualityFromManifest = mapManifests
    .map((manifest) => manifest.source_quality)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
  const levelOfDetailFromManifest = mapManifests
    .map((manifest) => manifest.level_of_detail)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  const categories: RegistryTagCategory[] = buildRegistryTagCategories({
    typeId,
    availableTags,
    mapSourceQualityValues: sourceQualityFromManifest,
    mapLevelOfDetailValues: levelOfDetailFromManifest,
  });

  return categories.map((category) => ({
    ...category,
    icon: CATEGORY_ICON_BY_ID[category.id],
  }));
}

function RegistryTagCategorySection({
  category,
  selectedTags,
  tagCounts,
  onTagToggle,
  isCollapsed,
  onToggleCategory,
}: RegistryTagCategorySectionProps) {
  const selectedCategoryTags = category.tags.filter((tag) => selectedTags.includes(tag));
  const selectedTagSet = new Set(selectedCategoryTags);
  const availableTags = category.tags.filter((tag) => !selectedTagSet.has(tag));

  return (
    <div className="space-y-1.5 px-1">
      <button
        type="button"
        onClick={() => onToggleCategory(category.id)}
        aria-expanded={!isCollapsed}
        className="group flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left text-foreground transition-colors duration-100 ease-out hover:text-[var(--asset-accent-light)] dark:hover:text-[var(--asset-accent-dark)]"
      >
        <category.icon
          className="size-4 shrink-0 text-foreground transition-colors duration-100 ease-out group-hover:text-[var(--asset-accent-light)] dark:group-hover:text-[var(--asset-accent-dark)]"
          aria-hidden={true}
        />
        <span className="flex-1 text-sm font-semibold tracking-wide text-inherit transition-colors duration-100 ease-out">
          {category.label}
        </span>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-[transform,color] duration-150 ease-out group-hover:text-[var(--asset-accent-light)] dark:group-hover:text-[var(--asset-accent-dark)]",
            !isCollapsed && "rotate-90",
          )}
          aria-hidden={true}
        />
      </button>

      {selectedCategoryTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selectedCategoryTags.map((tag) => {
            const count = tagCounts[tag] ?? 0;
            const displayTag = formatRegistryTagLabel(category.id, tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagToggle(tag)}
                className="group inline-flex items-center justify-between gap-2 rounded-md border border-[color-mix(in_srgb,var(--asset-accent-light)_35%,var(--border))] bg-[color-mix(in_srgb,var(--asset-accent-light)_12%,var(--background))] px-2 py-1 text-left text-xs text-[var(--asset-accent-light)] shadow-sm transition-colors duration-100 ease-out dark:border-[color-mix(in_srgb,var(--asset-accent-dark)_35%,var(--border))] dark:bg-[color-mix(in_srgb,var(--asset-accent-dark)_12%,var(--background))] dark:text-[var(--asset-accent-dark)]"
                aria-pressed={true}
              >
                <span className="truncate">{displayTag}</span>
                <span className="rounded-md border border-[color-mix(in_srgb,var(--asset-accent-light)_40%,var(--border))] bg-background px-1.5 py-0.5 text-[11px] tabular-nums text-[var(--asset-accent-light)] dark:border-[color-mix(in_srgb,var(--asset-accent-dark)_40%,var(--border))] dark:text-[var(--asset-accent-dark)]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none",
          isCollapsed
            ? "mt-0 grid-rows-[0fr] opacity-0"
            : "mt-1 grid-rows-[1fr] opacity-100",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              const count = tagCounts[tag] ?? 0;
              const displayTag = formatRegistryTagLabel(category.id, tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagToggle(tag)}
                  className={cn(
                    "group flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-100 ease-out",
                    isSelected
                      ? "bg-background text-[var(--asset-accent-light)] shadow-sm dark:text-[var(--asset-accent-dark)]"
                      : "text-muted-foreground hover:text-[var(--asset-accent-light)] dark:hover:text-[var(--asset-accent-dark)]",
                  )}
                  aria-pressed={isSelected}
                >
                  <span className="truncate">{displayTag}</span>
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-xs tabular-nums transition-[background-color,border-color,color] duration-100 ease-out",
                      isSelected
                        ? "border-[color-mix(in_srgb,var(--asset-accent-light)_40%,var(--border))] bg-[color-mix(in_srgb,var(--asset-accent-light)_12%,var(--background))] text-[var(--asset-accent-light)] dark:border-[color-mix(in_srgb,var(--asset-accent-dark)_40%,var(--border))] dark:bg-[color-mix(in_srgb,var(--asset-accent-dark)_12%,var(--background))] dark:text-[var(--asset-accent-dark)]"
                        : "border-border/30 bg-background text-muted-foreground group-hover:border-[color-mix(in_srgb,var(--asset-accent-light)_35%,var(--border))] group-hover:text-[var(--asset-accent-light)] dark:group-hover:border-[color-mix(in_srgb,var(--asset-accent-dark)_35%,var(--border))] dark:group-hover:text-[var(--asset-accent-dark)]",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getInitialCollapsedTagCategories(): Set<string> {
  try {
    const raw = sessionStorage.getItem(REGISTRY_TAG_CATEGORY_STATE_KEY);
    if (!raw) {
      return new Set();
    }
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistCollapsedTagCategories(next: Set<string>) {
  try {
    sessionStorage.setItem(REGISTRY_TAG_CATEGORY_STATE_KEY, JSON.stringify([...next]));
  } catch {
    // ignore persistence failures
  }
}

function RegistryToolbarIconButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-background transition-colors",
        "border-border/30 text-muted-foreground",
        !disabled &&
          "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_35%,var(--border))] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,var(--background))] hover:text-[var(--suite-accent-light)] dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_35%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_10%,var(--background))] dark:hover:text-[var(--suite-accent-dark)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled &&
          "cursor-not-allowed border-border/50 text-muted-foreground opacity-55 dark:text-muted-foreground",
      )}
    >
      {children}
    </button>
  );

  if (disabled) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function getInitialRegistrySidebarCollapsed() {
  try {
    return localStorage.getItem(REGISTRY_SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function RegistryFilterSidebar({
  typeId,
  typeItems,
  counts,
  onTypeChange,
  availableTags,
  selectedTags,
  onTagToggle,
  onTagsClear,
  onCollapsedChange,
}: RegistryFilterSidebarProps) {
  const categories = buildTagCategories(typeId, availableTags, typeItems);
  const tagCounts = useMemo(() => {
    return buildRegistryTagCounts(typeItems.map((item) => item.tags));
  }, [typeItems]);
  const activeType = REGISTRY_TYPES.find((type) => type.id === typeId) ?? REGISTRY_TYPES[0];
  const sidebarAccentStyle = {
    "--asset-accent-light": activeType.accentLight,
    "--asset-accent-dark": activeType.accentDark,
  } as React.CSSProperties;

  const { collapsed, setCollapsedState } = useSidebarCollapsed(REGISTRY_SIDEBAR_COLLAPSED_KEY);
  const scrollAreaContainerRef = useRef<HTMLDivElement>(null);
  const scrollAreaContentRef = useRef<HTMLDivElement>(null);
  const [showCollapsedRail, setShowCollapsedRail] = useState(collapsed);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    getInitialCollapsedTagCategories,
  );
  const [needsScrollArea, setNeedsScrollArea] = useState(false);

  useEffect(() => {
    if (collapsed) {
      setNeedsScrollArea(false);
      return;
    }

    const updateScrollAreaState = () => {
      const contentHeight = scrollAreaContentRef.current?.getBoundingClientRect().height ?? 0;
      const availableHeight = Math.max(window.innerHeight - SIDEBAR_SCROLL_HEIGHT_OFFSET_PX, 0);
      setNeedsScrollArea(contentHeight > availableHeight + 1);
    };

    updateScrollAreaState();

    const contentEl = scrollAreaContentRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            updateScrollAreaState();
          })
        : null;

    if (contentEl && resizeObserver) {
      resizeObserver.observe(contentEl);
    }

    window.addEventListener("resize", updateScrollAreaState);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollAreaState);
    };
  }, [collapsed, needsScrollArea]);

  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      persistCollapsedTagCategories(next);
      return next;
    });
  }, []);

  const handleScrollToTop = useCallback(() => {
    const viewport = scrollAreaContainerRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    viewport?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [onCollapsedChange, collapsed]);

  const handleExpand = useCallback(() => {
    setShowCollapsedRail(true);
    setCollapsedState(false);
  }, [setCollapsedState]);

  useEffect(() => {
    if (collapsed) {
      setShowCollapsedRail(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowCollapsedRail(false);
    }, SIDEBAR_LAYOUT_SHIFT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [collapsed]);

  return (
    <aside
      className={cn("lg:shrink-0", collapsed ? "hidden lg:block lg:w-11" : "w-full lg:w-[17.5rem]")}
      style={sidebarAccentStyle}
    >
      {showCollapsedRail ? (
        <div className="sticky top-20 self-start">
          <button
            type="button"
            onClick={handleExpand}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/30 bg-background p-0 text-muted-foreground transition-colors",
              "hover:border-[color-mix(in_srgb,var(--asset-accent-light)_35%,var(--border))] hover:bg-[color-mix(in_srgb,var(--asset-accent-light)_10%,var(--background))] hover:text-[var(--asset-accent-light)] dark:hover:border-[color-mix(in_srgb,var(--asset-accent-dark)_35%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--asset-accent-dark)_10%,var(--background))] dark:hover:text-[var(--asset-accent-dark)]",
            )}
          >
            <PanelLeftOpen className="size-4" aria-hidden="true" />
            <span className="sr-only">Expand sidebar</span>
          </button>
        </div>
      ) : (
        <SideRailShell>
          <SideRailHeader>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Filters
            </p>
          </SideRailHeader>

          <SideRailDivider />

          <div ref={scrollAreaContainerRef}>
            {needsScrollArea ? (
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div ref={scrollAreaContentRef} className="space-y-4 px-2.5 py-3">
                  <section className="space-y-2" aria-label="Registry type">
                    <p className="px-1 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
                      Asset Type
                    </p>

                    <div className="space-y-1">
                      {REGISTRY_TYPES.map((type) => {
                        const isActive = typeId === type.id;
                        const Icon = type.id === "maps" ? MapIcon : Package;
                        const count = counts?.[type.id];
                        const accentLight = type.accentLight;
                        const accentDark = type.accentDark;
                        const accentStyle = {
                          "--type-accent-light": accentLight,
                          "--type-accent-dark": accentDark,
                        } as React.CSSProperties;

                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => onTypeChange(type.id)}
                            aria-current={isActive ? "true" : undefined}
                            style={accentStyle}
                            className={cn(
                              "group relative flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition-colors",
                              isActive
                                ? "border-[color-mix(in_srgb,var(--type-accent-light)_45%,var(--border))] bg-[color-mix(in_srgb,var(--type-accent-light)_22%,var(--background))] text-[var(--type-accent-light)] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_45%,var(--border))] dark:bg-[color-mix(in_srgb,var(--type-accent-dark)_22%,var(--background))] dark:text-[var(--type-accent-dark)]"
                                : "border-[color-mix(in_srgb,var(--type-accent-light)_25%,var(--border))] text-[color-mix(in_srgb,var(--type-accent-light)_75%,var(--foreground))] hover:border-[color-mix(in_srgb,var(--type-accent-light)_35%,var(--border))] hover:bg-[color-mix(in_srgb,var(--type-accent-light)_12%,var(--background))] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_25%,var(--border))] dark:text-[color-mix(in_srgb,var(--type-accent-dark)_75%,var(--foreground))] dark:hover:border-[color-mix(in_srgb,var(--type-accent-dark)_35%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--type-accent-dark)_12%,var(--background))]",
                            )}
                          >
                            <Icon className="size-4 shrink-0" aria-hidden={true} />
                            <span className="flex-1">{type.pluralLabel}</span>
                            {count !== undefined ? (
                              <RegistryTypeCountBadge count={count} isActive={isActive} />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <SideRailDivider className="my-2 opacity-50" />

                  <section className="space-y-3" aria-label="Tag filters">
                    <div className="flex items-center justify-between gap-2 px-1">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
                        Tags
                      </p>
                    </div>

                    {categories.length === 0 ? (
                      <p className="px-1 text-xs text-muted-foreground">No tags available.</p>
                    ) : (
                      <div className="space-y-3">
                        {categories.map((category) => (
                          <RegistryTagCategorySection
                            key={category.id}
                            category={category}
                            selectedTags={selectedTags}
                            tagCounts={tagCounts}
                            onTagToggle={onTagToggle}
                            isCollapsed={collapsedCategories.has(category.id)}
                            onToggleCategory={toggleCategory}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </ScrollArea>
            ) : (
              <div ref={scrollAreaContentRef} className="space-y-4 px-2.5 py-3">
                <section className="space-y-2" aria-label="Registry type">
                  <p className="px-1 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
                    Asset Type
                  </p>

                  <div className="space-y-1">
                    {REGISTRY_TYPES.map((type) => {
                      const isActive = typeId === type.id;
                      const Icon = type.id === "maps" ? MapIcon : Package;
                      const count = counts?.[type.id];
                      const accentLight = type.accentLight;
                      const accentDark = type.accentDark;
                      const accentStyle = {
                        "--type-accent-light": accentLight,
                        "--type-accent-dark": accentDark,
                      } as React.CSSProperties;

                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => onTypeChange(type.id)}
                          aria-current={isActive ? "true" : undefined}
                          style={accentStyle}
                          className={cn(
                            "group relative flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition-colors",
                            isActive
                              ? "border-[color-mix(in_srgb,var(--type-accent-light)_45%,var(--border))] bg-[color-mix(in_srgb,var(--type-accent-light)_22%,var(--background))] text-[var(--type-accent-light)] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_45%,var(--border))] dark:bg-[color-mix(in_srgb,var(--type-accent-dark)_22%,var(--background))] dark:text-[var(--type-accent-dark)]"
                              : "border-[color-mix(in_srgb,var(--type-accent-light)_25%,var(--border))] text-[color-mix(in_srgb,var(--type-accent-light)_75%,var(--foreground))] hover:border-[color-mix(in_srgb,var(--type-accent-light)_35%,var(--border))] hover:bg-[color-mix(in_srgb,var(--type-accent-light)_12%,var(--background))] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_25%,var(--border))] dark:text-[color-mix(in_srgb,var(--type-accent-dark)_75%,var(--foreground))] dark:hover:border-[color-mix(in_srgb,var(--type-accent-dark)_35%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--type-accent-dark)_12%,var(--background))]",
                          )}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden={true} />
                          <span className="flex-1">{type.pluralLabel}</span>
                          {count !== undefined ? (
                            <RegistryTypeCountBadge count={count} isActive={isActive} />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <SideRailDivider className="my-2 opacity-50" />

                <section className="space-y-3" aria-label="Tag filters">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
                      Tags
                    </p>
                  </div>

                  {categories.length === 0 ? (
                    <p className="px-1 text-xs text-muted-foreground">No tags available.</p>
                  ) : (
                    <div className="space-y-3">
                      {categories.map((category) => (
                        <RegistryTagCategorySection
                          key={category.id}
                          category={category}
                          selectedTags={selectedTags}
                          tagCounts={tagCounts}
                          onTagToggle={onTagToggle}
                          isCollapsed={collapsedCategories.has(category.id)}
                          onToggleCategory={toggleCategory}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>

          <SideRailDivider />

          <div className="flex items-center justify-between gap-2 px-2.5 py-2">
            <RegistryToolbarIconButton
              label="Clear Filters"
              onClick={onTagsClear}
              disabled={selectedTags.length === 0}
            >
              <Trash2 className="size-3.5" aria-hidden={true} />
            </RegistryToolbarIconButton>
            <RegistryToolbarIconButton
              label="Collapse Sidebar"
              onClick={() => setCollapsedState(true)}
            >
              <PanelLeftClose className="size-3.5" aria-hidden={true} />
            </RegistryToolbarIconButton>
            <RegistryToolbarIconButton label="Jump to Top" onClick={handleScrollToTop}>
              <ArrowUpToLine className="size-3.5" aria-hidden={true} />
            </RegistryToolbarIconButton>
          </div>
        </SideRailShell>
      )}
    </aside>
  );
}
