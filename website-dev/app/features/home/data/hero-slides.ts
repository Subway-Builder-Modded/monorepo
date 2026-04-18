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
  overlayStrength?: number;
  kicker?: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "osaka",
    imageLight: "/images/home/osaka-light.png",
    imageDark: "/images/home/osaka-dark.png",
    alt: "Osaka",
  },
  {
    id: "san-juan",
    imageLight: "/images/home/san-juan-light.png",
    imageDark: "/images/home/san-juan-dark.png",
    alt: "San Juan",
  },
];

export const HERO_AUTO_ROTATE_MS = 10000;
