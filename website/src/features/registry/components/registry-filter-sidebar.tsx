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
import {
  ACCENT_HOVER_SURFACE_CLASS,
  ACCENT_ICON_BUTTON_CLASS,
  ACCENT_TOGGLE_ACTIVE_CLASS,
  ACCENT_TOGGLE_BASE_CLASS,
  ACCENT_TOGGLE_IDLE_MUTED_CLASS,
  ACCENT_TOGGLE_IDLE_TINTED_CLASS,
  SECTION_LABEL_CLASS,
  uiAccentStyle,
} from "@/features/registry/lib/registry-styles";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Trash2,
  ArrowUpToLine,
  Archive,
  CircleCheck,
} from "lucide-react";
import type { RegistryListingStatus } from "@/features/registry/lib/use-registry-params";
import { RegistryTagCategorySection } from "@/features/registry/components/registry-tag-category-section";

const REGISTRY_SIDEBAR_COLLAPSED_KEY = "sbm:registry-sidebar-collapsed";
const SIDEBAR_LAYOUT_SHIFT_MS = 200;
const SIDEBAR_SCROLL_HEIGHT_OFFSET_PX = 192;

/** The sidebar-level accent follows the active asset type. */
const SIDEBAR_UI_ACCENT_STYLE = uiAccentStyle(
  "var(--asset-accent-light)",
  "var(--asset-accent-dark)",
);

type RegistryFilterSidebarProps = {
  typeId: string;
  typeItems: RegistrySearchItem[];
  counts?: Record<string, number>;
  onTypeChange: (typeId: string) => void;
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onTagsClear: () => void;
  listingStatuses: readonly RegistryListingStatus[];
  listingStatusCounts: Record<RegistryListingStatus, number>;
  onListingStatusToggle: (status: RegistryListingStatus) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
};

/** Listing Status: a composable union over a listing's registry-side
 * lifecycle — Active (default), Deprecated, Deleted — mirroring the app.
 * Never empty: deselecting the last class is a no-op, surfaced as a disabled
 * chip. Retired options render only when the current type has such listings
 * (or one is selected via URL). */
function ListingStatusSection({
  listingStatuses,
  counts,
  onToggle,
}: {
  listingStatuses: readonly RegistryListingStatus[];
  counts: Record<RegistryListingStatus, number>;
  onToggle: (status: RegistryListingStatus) => void;
}) {
  const options: {
    value: RegistryListingStatus;
    label: string;
    Icon: typeof Archive;
    accentClass: string;
  }[] = [
    {
      value: "active",
      label: "Active",
      Icon: CircleCheck,
      accentClass: "text-emerald-600 dark:text-emerald-400",
    },
    // Slate blue: reversible retirement. Matches the app badge and chart series.
    {
      value: "deprecated",
      label: "Deprecated",
      Icon: Archive,
      accentClass: "text-slate-600 dark:text-slate-300",
    },
    // Darker charcoal: permanent retirement.
    {
      value: "deleted",
      label: "Deleted",
      Icon: Trash2,
      accentClass: "text-zinc-800 dark:text-zinc-200",
    },
  ];
  const visible = options.filter(
    ({ value }) => value === "active" || counts[value] > 0 || listingStatuses.includes(value),
  );
  if (visible.length <= 1) {
    return null;
  }

  return (
    <>
      <SideRailDivider className="my-2 opacity-50" />

      <section className="space-y-2" aria-label="Listing status">
        <p className={cn("px-1", SECTION_LABEL_CLASS)}>Listing Status</p>

        {visible.map(({ value, label, Icon, accentClass }) => {
          const active = listingStatuses.includes(value);
          // The last VISIBLE selected class cannot be deselected; hidden
          // zero-member classes contribute nothing to the union.
          const effective = visible.filter((option) => listingStatuses.includes(option.value));
          const locked = active && effective.length === 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              aria-pressed={active}
              disabled={locked}
              style={SIDEBAR_UI_ACCENT_STYLE}
              className={cn(
                ACCENT_TOGGLE_BASE_CLASS,
                active ? ACCENT_TOGGLE_ACTIVE_CLASS : ACCENT_TOGGLE_IDLE_MUTED_CLASS,
                active && accentClass,
                locked && "cursor-default",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden={true} />
              <span className="flex-1">{label}</span>
              <RegistryTypeCountBadge count={counts[value]} isActive={active} />
            </button>
          );
        })}
      </section>
    </>
  );
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
      style={uiAccentStyle("var(--suite-accent-light)", "var(--suite-accent-dark)")}
      className={cn(
        ACCENT_ICON_BUTTON_CLASS,
        "h-8 w-8",
        !disabled && ACCENT_HOVER_SURFACE_CLASS,
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

type SidebarFilterContentProps = {
  typeId: string;
  counts?: Record<string, number>;
  onTypeChange: (typeId: string) => void;
  categories: ReturnType<typeof buildTagCategories>;
  selectedTags: string[];
  tagCounts: Record<string, number>;
  onTagToggle: (tag: string) => void;
  collapsedCategories: Set<string>;
  onToggleCategory: (categoryId: string) => void;
  listingStatuses: readonly RegistryListingStatus[];
  listingStatusCounts: Record<RegistryListingStatus, number>;
  onListingStatusToggle: (status: RegistryListingStatus) => void;
};

/** The sidebar's filter sections, shared between the scroll-area and plain
 * layouts so the two render paths cannot drift apart. */
function SidebarFilterContent({
  typeId,
  counts,
  onTypeChange,
  categories,
  selectedTags,
  tagCounts,
  onTagToggle,
  collapsedCategories,
  onToggleCategory,
  listingStatuses,
  listingStatusCounts,
  onListingStatusToggle,
}: SidebarFilterContentProps) {
  return (
    <>
      <section className="space-y-2" aria-label="Registry type">
        <p className={cn("px-1", SECTION_LABEL_CLASS)}>Asset Type</p>

        <div className="space-y-1">
          {REGISTRY_TYPES.map((type) => {
            const isActive = typeId === type.id;
            const Icon = getRegistryTypeIcon(type.id);
            const count = counts?.[type.id];

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onTypeChange(type.id)}
                aria-current={isActive ? "true" : undefined}
                style={uiAccentStyle(type.accentLight, type.accentDark)}
                className={cn(
                  ACCENT_TOGGLE_BASE_CLASS,
                  isActive ? ACCENT_TOGGLE_ACTIVE_CLASS : ACCENT_TOGGLE_IDLE_TINTED_CLASS,
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
          <p className={SECTION_LABEL_CLASS}>Tags</p>
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
                onToggleCategory={onToggleCategory}
              />
            ))}
          </div>
        )}
      </section>

      <ListingStatusSection
        listingStatuses={listingStatuses}
        counts={listingStatusCounts}
        onToggle={onListingStatusToggle}
      />
    </>
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
  listingStatuses,
  listingStatusCounts,
  onListingStatusToggle,
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

  const filterContent = (
    <SidebarFilterContent
      typeId={typeId}
      counts={counts}
      onTypeChange={onTypeChange}
      categories={categories}
      selectedTags={selectedTags}
      tagCounts={tagCounts}
      onTagToggle={onTagToggle}
      collapsedCategories={collapsedCategories}
      onToggleCategory={toggleCategory}
      listingStatuses={listingStatuses}
      listingStatusCounts={listingStatusCounts}
      onListingStatusToggle={onListingStatusToggle}
    />
  );

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
            style={SIDEBAR_UI_ACCENT_STYLE}
            className={cn(ACCENT_ICON_BUTTON_CLASS, "h-9 w-9 p-0", ACCENT_HOVER_SURFACE_CLASS)}
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
                  {filterContent}
                </div>
              </ScrollArea>
            ) : (
              <div ref={scrollAreaContentRef} className="space-y-4 px-2.5 py-3">
                {filterContent}
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
