import type { StyleSpecification } from "maplibre-gl";

export type ResolvedTheme = "light" | "dark";

export type SubwayThemeColors = {
  roads: string;
  buildings: string;
  water: string;
  background: string;
  parks: string;
  airports: string;
  runways: string;
  roadLabel: string;
  roadLabelHalo: string;
  neighborhoodLabel: string;
  neighborhoodLabelHalo: string;
  cityLabel: string;
  cityLabelHalo: string;
};

const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const THEME_COLORS: Record<ResolvedTheme, SubwayThemeColors> = {
  light: {
    roads: "#DCDCDC",
    buildings: "#DDDDDD",
    water: "#9FC9EA",
    background: "#F2E7D3",
    parks: "#A9D8B6",
    airports: "#F0F1F5",
    runways: "#DFE2E7",
    roadLabel: "#807F7A",
    roadLabelHalo: "#FFFFFF",
    neighborhoodLabel: "#9CA3AF",
    neighborhoodLabelHalo: "#FFFFFF",
    cityLabel: "#5D6066",
    cityLabelHalo: "#FFFFFF",
  },
  dark: {
    roads: "#3d4250",
    buildings: "#2a3040",
    water: "#0d1722",
    background: "#05070d",
    parks: "#111720",
    airports: "#141a24",
    runways: "#1f2733",
    roadLabel: "#5a6272",
    roadLabelHalo: "#0a0d15",
    neighborhoodLabel: "#687284",
    neighborhoodLabelHalo: "#0a0d15",
    cityLabel: "#8e98ac",
    cityLabelHalo: "#0a0d15",
  },
};

function shouldRemoveOverlayLayer(layerId: string): boolean {
  return (
    layerId === "natural_earth" ||
    layerId.includes("graticule") ||
    layerId.includes("equator") ||
    layerId.includes("tropic") ||
    layerId.includes("latitude") ||
    layerId.includes("longitude")
  );
}

function isRoadLayer(layerId: string): boolean {
  return (
    layerId.includes("road") ||
    layerId.includes("street") ||
    layerId.includes("highway") ||
    layerId.includes("motorway") ||
    layerId.includes("bridge_") ||
    layerId.includes("tunnel_")
  );
}

function labelStyleForLayer(layerId: string, palette: SubwayThemeColors) {
  if (layerId.includes("highway-name") || layerId.includes("road_shield")) {
    return { text: palette.roadLabel, halo: palette.roadLabelHalo };
  }

  if (layerId.includes("city") || layerId.includes("country") || layerId.includes("state")) {
    return { text: palette.cityLabel, halo: palette.cityLabelHalo };
  }

  return {
    text: palette.neighborhoodLabel,
    halo: palette.neighborhoodLabelHalo,
  };
}

function scaledOpacity(value: unknown, scale: number) {
  if (typeof value === "number") {
    return Math.max(0, Math.min(1, value * scale));
  }
  return scale;
}

export type ThemedStyleOptions = {
  /** Uniform opacity multiplier for basemap layers; 1 leaves base opacities untouched. */
  opacityScale?: number;
};

export async function buildThemedStyle(
  theme: ResolvedTheme,
  options?: ThemedStyleOptions,
): Promise<StyleSpecification> {
  const opacityScale = options?.opacityScale ?? 1;
  const styleResponse = await fetch(BASE_STYLE_URL);
  if (!styleResponse.ok) {
    throw new Error(`Failed to fetch base map style (${styleResponse.status})`);
  }

  const baseStyle = (await styleResponse.json()) as StyleSpecification;
  const baseLayers = (baseStyle.layers ?? []) as Array<Record<string, unknown>>;
  const palette = THEME_COLORS[theme];

  const themedLayers = baseLayers
    .filter((layer) => {
      const layerId = String(layer.id ?? "").toLowerCase();
      if (shouldRemoveOverlayLayer(layerId)) return false;

      if (String(layer.type ?? "") === "symbol") {
        const layout = layer.layout as Record<string, unknown> | undefined;
        const hasText = Boolean(layout?.["text-field"]);
        const hasIcon = Boolean(layout?.["icon-image"]);
        if (!hasText || hasIcon || layerId.includes("shield")) return false;
      }

      return true;
    })
    .map((layer) => {
      const nextLayer: Record<string, unknown> = { ...layer };
      const originalLayout = layer.layout as Record<string, unknown> | undefined;
      const originalPaint = layer.paint as Record<string, unknown> | undefined;
      if (originalLayout) nextLayer.layout = { ...originalLayout };
      if (originalPaint) nextLayer.paint = { ...originalPaint };

      const layerId = String(layer.id ?? "").toLowerCase();
      const layerType = String(layer.type ?? "");
      const layout = nextLayer.layout as Record<string, unknown> | undefined;
      const paint = nextLayer.paint as Record<string, unknown> | undefined;

      if (layerType === "symbol" && layout?.["text-field"]) {
        layout["text-field"] = [
          "coalesce",
          ["get", "name_en"],
          ["get", "name:en"],
          ["get", "name_int"],
          ["get", "name"],
        ];
      }

      if (!paint) return nextLayer;

      if (layerType === "background") {
        paint["background-color"] = palette.background;
        if (opacityScale !== 1) {
          paint["background-opacity"] = scaledOpacity(paint["background-opacity"], opacityScale);
        }
      }

      if (layerType === "fill") {
        if ("fill-pattern" in paint) delete paint["fill-pattern"];
        if (opacityScale !== 1) {
          paint["fill-opacity"] = scaledOpacity(paint["fill-opacity"], opacityScale);
        }

        if (layerId.includes("water")) {
          paint["fill-color"] = palette.water;
          paint["fill-outline-color"] = palette.water;
        } else if (layerId.includes("ice")) {
          paint["fill-color"] = palette.buildings;
          paint["fill-outline-color"] = palette.buildings;
        } else if (layerId === "building" || layerId.includes("building-3d")) {
          paint["fill-color"] = palette.buildings;
          paint["fill-outline-color"] = palette.buildings;
        } else if (layerId.includes("aeroway")) {
          const value = layerId.includes("runway") ? palette.runways : palette.airports;
          paint["fill-color"] = value;
          paint["fill-outline-color"] = value;
        } else if (
          layerId.includes("park") ||
          layerId.includes("green") ||
          layerId.includes("landcover_wood") ||
          layerId.includes("landcover_grass") ||
          layerId.includes("landcover_wetland")
        ) {
          paint["fill-color"] = palette.parks;
          paint["fill-outline-color"] = palette.parks;
        } else if (
          layerId.includes("natural_earth") ||
          layerId.includes("landuse") ||
          layerId.includes("landcover")
        ) {
          paint["fill-color"] = palette.background;
          paint["fill-outline-color"] = palette.background;
        }
      }

      if (layerType === "line") {
        if (opacityScale !== 1) {
          paint["line-opacity"] = scaledOpacity(paint["line-opacity"], opacityScale);
        }

        if (layerId.includes("water")) {
          paint["line-color"] = palette.water;
        } else if (layerId === "park_outline") {
          paint["line-color"] = palette.parks;
          paint["line-opacity"] = 0.25;
        } else if (layerId.includes("aeroway_runway") || layerId.includes("aeroway_taxiway")) {
          paint["line-color"] = palette.runways;
        } else if (layerId.includes("aeroway")) {
          paint["line-color"] = palette.airports;
        } else if (isRoadLayer(layerId)) {
          paint["line-color"] = palette.roads;
        } else if (layerId.includes("boundary")) {
          paint["line-color"] = palette.neighborhoodLabel;
        }
      }

      if (layerType === "symbol") {
        const labelStyle = labelStyleForLayer(layerId, palette);
        paint["text-color"] = labelStyle.text;
        paint["text-halo-color"] = labelStyle.halo;
        paint["text-halo-width"] = 1.8;
      }

      return nextLayer;
    });

  return {
    ...baseStyle,
    layers: themedLayers as StyleSpecification["layers"],
  };
}
