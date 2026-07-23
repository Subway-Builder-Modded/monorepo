import {
  buildRegistryTagCategories,
  buildRegistryTagCounts,
  formatRegistryTagLabel,
  resolveDataQualityTier,
  type RegistryTagCategory,
  type RegistryTagCategoryId,
} from "@subway-builder-modded/config";
import { Tags, Layers3, BadgeCheck, GraduationCap, Globe2 } from "lucide-react";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";

const REGISTRY_TAG_CATEGORY_STATE_KEY = "sbm:registry-tag-categories-collapsed";

export type TagCategory = {
  id: RegistryTagCategoryId;
  label: string;
  icon: typeof Tags;
  tags: string[];
  defaultCollapsed?: boolean;
};

const CATEGORY_ICON_BY_ID: Record<RegistryTagCategoryId, typeof Tags> = {
  regions: Globe2,
  "data-quality": BadgeCheck,
  "level-of-detail": Layers3,
  "special-demand": GraduationCap,
  content: Layers3,
  other: Tags,
};

export function buildTagCategories(
  typeId: string,
  availableTags: string[],
  typeItems: RegistrySearchItem[],
): TagCategory[] {
  const mapManifests = typeItems
    .map((item) => item.manifest)
    .filter((manifest): manifest is Record<string, unknown> =>
      Boolean(manifest && typeof manifest === "object"),
    );
  const dataQualityFromManifest = mapManifests.map((manifest) =>
    resolveDataQualityTier(manifest as { data_quality?: { tier?: string | null } | null }),
  );
  const levelOfDetailFromManifest = mapManifests
    .map((manifest) => manifest.level_of_detail)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  const categories: RegistryTagCategory[] = buildRegistryTagCategories({
    typeId,
    availableTags,
    mapDataQualityValues: dataQualityFromManifest,
    mapLevelOfDetailValues: levelOfDetailFromManifest,
  });

  const categoriesWithIcons = categories.map((category) => ({
    ...category,
    icon: CATEGORY_ICON_BY_ID[category.id],
  }));

  const bottomCategoryIds: RegistryTagCategoryId[] = ["data-quality", "level-of-detail"];

  return categoriesWithIcons.sort((left, right) => {
    const leftBottomIndex = bottomCategoryIds.indexOf(left.id);
    const rightBottomIndex = bottomCategoryIds.indexOf(right.id);

    const leftIsBottom = leftBottomIndex !== -1;
    const rightIsBottom = rightBottomIndex !== -1;

    if (leftIsBottom && rightIsBottom) {
      return leftBottomIndex - rightBottomIndex;
    }

    if (leftIsBottom) {
      return 1;
    }

    if (rightIsBottom) {
      return -1;
    }

    return 0;
  });
}

export function getInitialCollapsedTagCategories(): Set<string> {
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

export function persistCollapsedTagCategories(next: Set<string>) {
  try {
    sessionStorage.setItem(REGISTRY_TAG_CATEGORY_STATE_KEY, JSON.stringify([...next]));
  } catch {
    // ignore persistence failures
  }
}

export function getRegistryTagCountsForItems(typeItems: RegistrySearchItem[]) {
  return buildRegistryTagCounts(typeItems.map((item) => item.tags));
}

export function getRegistryTagLabel(categoryId: RegistryTagCategoryId, tag: string): string {
  return formatRegistryTagLabel(categoryId, tag);
}
