export type DepotHeroCtaVariant = "solid" | "outline";

export type DepotHeroCta = {
  label: string;
  href: string;
  variant: DepotHeroCtaVariant;
  icon: string;
  external?: boolean;
};

export type DepotHeroContent = {
  title: string;
  description: string;
  primaryCta: DepotHeroCta;
  secondaryCta: DepotHeroCta;
};

export type DepotScrollytellingImage = {
  imageLight: string;
  imageDark: string;
  imageAlt: string;
};

export type DepotScrollytellingStep = {
  id: string;
  title: string;
  icon: string;
  image: DepotScrollytellingImage;
  bullets: string[];
};

export type DepotScrollytellingSection = {
  title: string;
  description: string;
  steps: DepotScrollytellingStep[];
};

export type DepotOperationsCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
  bullets: string[];
};

export type DepotOperationsSection = {
  title: string;
  description: string;
  cards: DepotOperationsCard[];
};

export type DepotFinalCtaSection = {
  title: string;
  description: string;
  primaryCta: DepotHeroCta;
  secondaryCta: DepotHeroCta;
};
