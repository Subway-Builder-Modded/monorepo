import {
  buildTagCategories,
  getInitialCollapsedTagCategories,
  getRegistryTagCountsForItems,
  persistCollapsedTagCategories,
} from "./registry-filter-sidebar-utils";
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
import { getRegistryTypeIcon } from "@/features/registry/registry-type-ui";
import { RegistryTypeCountBadge } from "@/features/registry/components/registry-type-count-badge";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { PanelLeftOpen, PanelLeftClose, Trash2, ArrowUpToLine } from "lucide-react";
import { RegistryTagCategorySection } from "@/features/registry/components/registry-tag-category-section";

const REGISTRY_SIDEBAR_COLLAPSED_KEY = "sbm:registry-sidebar-collapsed";
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
    return getRegistryTagCountsForItems(typeItems);
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
                        const Icon = getRegistryTypeIcon(type.id);
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
                      const Icon = getRegistryTypeIcon(type.id);
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
