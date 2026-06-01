export type Bbox = [number, number, number, number];

export type MetricId =
  | "residentCount"
  | "jobCount"
  | "pointDensity"
  | "workToHomeCommuteDistance"
  | "homeToWorkCommuteDistance";

export type GridFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
  properties: Record<MetricId, number> & {
    centroidLng?: number;
    centroidLat?: number;
  };
};

export type GridSnapshot = {
  mapId: string;
  bbox: Bbox;
  featureCount: number;
  metrics: Record<
    MetricId,
    {
      min: number;
      max: number;
      p95: number;
      p98: number;
      recommendedMax: number;
      nonZeroCount: number;
    }
  >;
  geojson: {
    type: "FeatureCollection";
    features: GridFeature[];
  };
};

export type MapLibreBoundsLike = [[number, number], [number, number]];

export type HoverInfo = {
  x: number;
  y: number;
  values: Record<MetricId, number>;
  centroidLng: number | null;
  centroidLat: number | null;
};

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
