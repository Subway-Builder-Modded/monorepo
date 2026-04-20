import type { HeroSlide } from "./types";

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "osaka",
    imageLight: "/images/home/osaka-light.png",
    imageDark: "/images/home/osaka-dark.png",
    alt: "Osaka",
    mapName: "Osaka",
    mapId: "yukina-osaka",
    creator: "Yukina-",
    saveFileCreator: "mygetaway",
    mods: [{ name: "Regions", author: "Yukina-", modId: "subwaybuilder-regions" }],
  },
  {
    id: "san-juan",
    imageLight: "/images/home/san-juan-light.png",
    imageDark: "/images/home/san-juan-dark.png",
    alt: "San Juan",
    mapName: "San Juan",
    mapId: "san-juan",
    creator: "slurry",
    saveFileCreator: "slurry",
    mods: [{ name: "Advanced Analytics", author: "Steno", modId: "advanced-analytics" }],
  },
  {
    id: "vancouver",
    imageLight: "/images/home/vancouver-light.png",
    imageDark: "/images/home/vancouver-dark.png",
    alt: "Vancouver",
    mapName: "Vancouver",
    mapId: "vancouver",
    creator: "devenperez",
    saveFileCreator: "seraphina_.",
    mods: [{ name: "Station Dots", author: "naz", modId: "station-dots" }],
  },
];

export const HERO_AUTO_ROTATE_MS = 10_000;

export const HERO_TITLE_LINE_1 = "Subway Builder";
export const HERO_TITLE_LINE_2 = "Modded";
export const HERO_DESCRIPTION = "The complete hub for everything modded in Subway Builder.";

export const HERO_CTA_GITHUB = {
  label: "GitHub",
  href: "https://github.com/Subway-Builder-Modded",
} as const;

export const HERO_CTA_DISCORD = {
  label: "Discord",
  href: "https://discord.gg/syG9YHMyeG",
} as const;

export const HERO_CREDITS_TEXT = {
  buttonAriaLabel: "View image credits and map information",
  mapDetailsTitle: "Map Details",
  creatorLabel: "Creator",
  saveFileTitle: "Save File",
  modsTitle: "Mods",
} as const;
