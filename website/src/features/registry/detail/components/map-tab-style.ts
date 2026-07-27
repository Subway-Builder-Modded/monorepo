import type { StyleSpecification } from "maplibre-gl";
import { buildThemedStyle as buildSharedThemedStyle } from "@/features/registry/lib/themed-map-style";
import type { ResolvedTheme } from "./map-tab-types";

const BASEMAP_OPACITY_SCALE = 0.72;

export function buildThemedStyle(theme: ResolvedTheme): Promise<StyleSpecification> {
  return buildSharedThemedStyle(theme, { opacityScale: BASEMAP_OPACITY_SCALE });
}
