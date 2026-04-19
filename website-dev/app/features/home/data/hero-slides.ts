export type HeroSlideMod = {
  name: string;
  author: string;
  modId: string;
};

export type HeroSlide = {
  id: string;
  imageLight: string;
  imageDark: string;
  alt: string;
  mapName?: string;
  mapId?: string;
  creator?: string;
  saveFileCreator?: string;
  mods?: HeroSlideMod[];
  focalPointLight?: string;
  focalPointDark?: string;
};

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
];

export const HERO_AUTO_ROTATE_MS = 10_000;
