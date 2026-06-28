import type { SiteSuiteId } from "@/config/site-navigation";
import type { HomeIconName } from "./icons";

export type HomeAccent = {
  light: string;
  dark: string;
};

export type HomeCta = {
  label: string;
  href: string;
  external?: boolean;
};

export type HomeAction = HomeCta & {
  icon: HomeIconName;
};

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

export type PeopleDestination = {
  id: string;
  icon: HomeIconName;
  title: string;
  description: string;
  href: string;
  label: string;
};

export type AnalyticsPreviewSeries = {
  label: string;
  color: string;
  points: string;
};

export type AnalyticsLink = {
  label: string;
  href: string;
  icon: HomeIconName;
  accentSuiteId: SiteSuiteId;
};

export type SuiteStepImageMedia = {
  kind: "image";
  imageLight: string;
  imageDark: string;
  imageAlt: string;
};

export type SuiteStepCodeMedia = {
  kind: "code";
  code: {
    content: string;
    lang: string;
    fileName: string;
  };
};

export type SuiteStep = {
  id: string;
  accentSuiteId: SiteSuiteId;
  title: string;
  description: string;
  bullets: string[];
  icon: HomeIconName;
  media: SuiteStepImageMedia | SuiteStepCodeMedia;
  primaryAction: HomeAction;
  secondaryAction: HomeAction;
};
