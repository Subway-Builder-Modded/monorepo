import type {
  DepotFinalCtaSection,
  DepotHeroContent,
  DepotOperationsSection,
  DepotScrollytellingSection,
} from "@/features/depot/depot-types";

export const DEPOT_HERO_CONTENT: DepotHeroContent = {
  title: "Depot",
  description: "The core Python library powering the Subway Builder Modded map creation ecosystem.",
  primaryCta: {
    label: "Get Started",
    href: "https://github.com/Subway-Builder-Modded/depot",
    variant: "solid",
    icon: "Github",
  },
  secondaryCta: {
    label: "Documentation",
    href: "/depot/docs",
    variant: "outline",
    icon: "BookText",
  },
};

export const DEPOT_SCROLLYTELLING_CONTENT: DepotScrollytellingSection = {
  title: "How Depot Builds a City",
  description:
    "Depot handles the full pipeline from raw data to ready-to-ship maps to be played in Subway Builder via [Railyard](/railyard).",
  steps: [
    {
      id: "buildings",
      title: "**Buildings**",
      icon: "Building2",
      image: {
        imageLight: "/images/depot/buildings-light.png",
        imageDark: "/images/depot/buildings-dark.png",
        imageAlt: "Depot source data preparation view",
      },
      bullets: [
        "Download building data from Overture Maps, or provide your own GeoJSON.",
        "Convert the building data into Subway Builder's `buildings_index.json`.",
        "Filter out buildings below a chosen size to limit the file size if desired.",
      ],
    },
    {
      id: "roads-aeroways",
      title: "**Roads, Runways, and Taxiways**",
      icon: "Road",
      image: {
        imageLight: "/images/depot/roads-aeroways-light.png",
        imageDark: "/images/depot/roads-aeroways-dark.png",
        imageAlt: "Depot map composition preview",
      },
      bullets: [
        "Extract the roads, runways, and taxiways for your map.",
        "Create the associated GeoJSON files for Subway Builder.",
      ],
    },
    {
      id: "pmtiles-labels",
      title: "**PMTiles & Labels**",
      icon: "Languages",
      image: {
        imageLight: "/images/depot/pmtiles-labels-light.png",
        imageDark: "/images/depot/pmtiles-labels-dark.png",
        imageAlt: "Depot generated artifact output",
      },
      bullets: [
        "Creates an optimized PMTiles, including the buildings from `process_buildings`",
        "Choose which types of labels (e.g., cities, suburbs, towns, villages, neighborhoods) are added to the PMTiles at low, moderate, and high zoom levels",
      ],
    },
  ],
};

export const DEPOT_OPERATIONS_CONTENT: DepotOperationsSection = {
  title: "Tune the Map Pipeline",
  description:
    "Depot is built for the parts of map creation that need repeated runs: adjusting geometry, rebuilding tiles, and checking the generated files before a map is packaged.",
  cards: [
    {
      id: "rerun-focused-stages",
      title: "Rerun Focused Stages",
      description:
        "Use individual `MapGen` methods when you are tuning one part of the map instead of rebuilding everything every time.",
      icon: "RefreshCw",
      bullets: [
        "Re-run building and tile steps while adjusting filters or simplification.",
        "Re-run label generation while testing city, suburb, and neighborhood rules.",
      ],
    },
    {
      id: "generated-map-files",
      title: "Generated Map Files",
      description:
        "Depot produces the core non-demand files Subway Builder maps need, keeping each output tied to the stage that created it.",
      icon: "PackageCheck",
      bullets: [
        "Create `buildings_index.json`, `roads.geojson`, `runways_taxiways.geojson`, and PMTiles outputs.",
        "Keep generated artifacts grouped under the configured city output folder.",
      ],
    },
    {
      id: "mapmaker-toolchain",
      title: "Mapmaker Toolchain",
      description:
        "Depot wraps a Python and CLI-heavy workflow, so map creators can focus on source data, bounds, labels, and output quality.",
      icon: "TerminalSquare",
      bullets: [
        "Work from a repeatable conda environment and shell-based toolchain.",
        "Tune `bbox`, RAM, cores, building filters, and OSM place label categories.",
      ],
    },
  ],
};

export const DEPOT_FINAL_CTA_CONTENT: DepotFinalCtaSection = {
  title: "Build Your Next City",
  description:
    "Depot handles the full pipeline, from just a bbox to a completed map. Once you get it set up and tune the settings to your necessity, you're good to go.",
  primaryCta: {
    label: "Get Started",
    href: "https://github.com/Subway-Builder-Modded/depot",
    variant: "solid",
    icon: "Github",
    external: true,
  },
  secondaryCta: {
    label: "Documentation",
    href: "/depot/docs",
    variant: "outline",
    icon: "BookText",
  },
};
