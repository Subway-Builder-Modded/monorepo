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
  SideRailUtilityButton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@subway-builder-modded/shared-ui";
import { useMemo, useCallback, useEffect, useState } from "react";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
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
} from "lucide-react";

const REGISTRY_SIDEBAR_COLLAPSED_KEY = "sbm:registry-sidebar-collapsed";

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
  const [playExpandAnimation, setPlayExpandAnimation] = useState(false);

  const handleExpand = useCallback(() => {
    setPlayExpandAnimation(true);
    setCollapsedState(false);
  }, [setCollapsedState]);

  useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [onCollapsedChange, collapsed]);

  if (collapsed) {
    return (
      <aside className="hidden w-11 shrink-0 lg:block" style={sidebarAccentStyle}>
        <div className="sticky top-20 self-start">
          <button
            type="button"
            onClick={handleExpand}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 bg-background/92 p-0 shadow-sm transition-colors",
              "border-[color-mix(in_srgb,var(--asset-accent-light)_34%,var(--border))] text-[var(--asset-accent-light)]",
              "dark:border-[color-mix(in_srgb,var(--asset-accent-dark)_40%,var(--border))] dark:text-[var(--asset-accent-dark)]",
              "hover:border-[color-mix(in_srgb,var(--asset-accent-light)_55%,var(--border))] hover:bg-[color-mix(in_srgb,var(--asset-accent-light)_10%,var(--background))]",
              "dark:hover:border-[color-mix(in_srgb,var(--asset-accent-dark)_60%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--asset-accent-dark)_12%,var(--background))]",
            )}
          >
            <PanelLeftOpen className="size-4" aria-hidden="true" />
            <span className="sr-only">Expand sidebar</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "w-full lg:w-[17.5rem] lg:shrink-0",
        playExpandAnimation && "lg:animate-in lg:slide-in-from-left-96 lg:duration-200",
      )}
      style={sidebarAccentStyle}
      onAnimationEnd={() => setPlayExpandAnimation(false)}
    >
      <SideRailShell>
        <SideRailHeader>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Filters
          </p>
        </SideRailHeader>

        <SideRailDivider />

        <ScrollArea className="h-[calc(100vh-12rem)] [scrollbar-gutter:stable]">
          <div className="space-y-3 px-2.5 py-3">
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
                        "group relative flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                        isActive
                          ? "border-[color-mix(in_srgb,var(--type-accent-light)_30%,var(--border))] bg-[color-mix(in_srgb,var(--type-accent-light)_12%,var(--background))] text-[var(--type-accent-light)] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_34%,var(--border))] dark:bg-[color-mix(in_srgb,var(--type-accent-dark)_16%,var(--background))] dark:text-[var(--type-accent-dark)]"
                          : "border-border/60 text-muted-foreground hover:border-[color-mix(in_srgb,var(--type-accent-light)_28%,var(--border))] hover:bg-[color-mix(in_srgb,var(--type-accent-light)_9%,var(--background))] hover:text-[var(--type-accent-light)] dark:hover:border-[color-mix(in_srgb,var(--type-accent-dark)_34%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--type-accent-dark)_12%,var(--background))] dark:hover:text-[var(--type-accent-dark)]",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden={true} />
                      <span className="flex-1">{type.pluralLabel}</span>
                      {count !== undefined ? (
                        <span
                          className={cn(
                            "rounded-md border bg-background px-1.5 py-0.5 text-xs tabular-nums text-inherit transition-colors",
                            isActive
                              ? "border-[color-mix(in_srgb,var(--type-accent-light)_45%,var(--border))] bg-[color-mix(in_srgb,var(--type-accent-light)_18%,var(--background))] text-[var(--type-accent-light)] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_45%,var(--border))] dark:bg-[color-mix(in_srgb,var(--type-accent-dark)_20%,var(--background))] dark:text-[var(--type-accent-dark)]"
                              : "border-border/45 group-hover:border-[color-mix(in_srgb,var(--type-accent-light)_45%,var(--border))] group-hover:bg-[color-mix(in_srgb,var(--type-accent-light)_18%,var(--background))] group-hover:text-[var(--type-accent-light)] dark:group-hover:border-[color-mix(in_srgb,var(--type-accent-dark)_45%,var(--border))] dark:group-hover:bg-[color-mix(in_srgb,var(--type-accent-dark)_20%,var(--background))] dark:group-hover:text-[var(--type-accent-dark)]",
                          )}
                        >
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <SideRailDivider className="my-3" />

            <section className="space-y-3" aria-label="Tag filters">
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  Tags
                </p>
                {selectedTags.length > 0 ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={onTagsClear}
                          aria-label="Clear all tags"
                          className={cn(
                            "rounded-md p-0.5 text-muted-foreground transition-colors",
                            "hover:text-[var(--asset-accent-light)] dark:hover:text-[var(--asset-accent-dark)]",
                          )}
                        >
                          <Trash2 className="size-3" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Clear All</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>

              {categories.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">No tags available.</p>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className="space-y-1.5">
                      <p className="flex items-center gap-2 px-1 text-sm font-bold tracking-wide text-[var(--asset-accent-light)] dark:text-[var(--asset-accent-dark)]">
                        <category.icon className="size-4.5" aria-hidden={true} />
                        {category.label}
                      </p>
                      <div className="space-y-1">
                        {category.tags.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          const count = tagCounts[tag] ?? 0;
                          const displayTag = formatRegistryTagLabel(category.id, tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => onTagToggle(tag)}
                              className={cn(
                                "group flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-[background-color,color] duration-150",
                                isSelected
                                  ? "bg-[color-mix(in_srgb,var(--asset-accent-light)_18%,var(--background))] text-[var(--asset-accent-light)] dark:bg-[color-mix(in_srgb,var(--asset-accent-dark)_20%,var(--background))] dark:text-[var(--asset-accent-dark)]"
                                  : "text-muted-foreground hover:bg-[color-mix(in_srgb,var(--asset-accent-light)_10%,var(--background))] hover:text-[var(--asset-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--asset-accent-dark)_12%,var(--background))] dark:hover:text-[var(--asset-accent-dark)]",
                              )}
                              aria-pressed={isSelected}
                            >
                              <span className="truncate">{displayTag}</span>
                              <span
                                className={cn(
                                  "rounded-md border px-1.5 py-0.5 text-xs tabular-nums transition-colors",
                                  isSelected
                                    ? "border-[color-mix(in_srgb,var(--asset-accent-light)_45%,var(--border))] bg-[color-mix(in_srgb,var(--asset-accent-light)_18%,var(--background))] text-[var(--asset-accent-light)] dark:border-[color-mix(in_srgb,var(--asset-accent-dark)_45%,var(--border))] dark:bg-[color-mix(in_srgb,var(--asset-accent-dark)_20%,var(--background))] dark:text-[var(--asset-accent-dark)]"
                                    : "border-border/55 bg-background text-muted-foreground group-hover:border-[color-mix(in_srgb,var(--asset-accent-light)_45%,var(--border))] group-hover:bg-[color-mix(in_srgb,var(--asset-accent-light)_18%,var(--background))] group-hover:text-[var(--asset-accent-light)] dark:group-hover:border-[color-mix(in_srgb,var(--asset-accent-dark)_45%,var(--border))] dark:group-hover:bg-[color-mix(in_srgb,var(--asset-accent-dark)_20%,var(--background))] dark:group-hover:text-[var(--asset-accent-dark)]",
                                )}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>

        <SideRailDivider />

        <div className="px-2.5 py-2">
          <SideRailUtilityButton onClick={() => setCollapsedState(true)}>
            <PanelLeftClose className="size-3.5" aria-hidden="true" />
            <span>Collapse Sidebar</span>
          </SideRailUtilityButton>
        </div>
      </SideRailShell>
    </aside>
  );
}
