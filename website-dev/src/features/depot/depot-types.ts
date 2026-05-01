export type DepotHeroCtaVariant = "solid" | "outline";

export type DepotHeroCta = {
  label: string;
  href: string;
  variant: DepotHeroCtaVariant;
  icon: string;
};

export type DepotHeroContent = {
  title: string;
  description: string;
  primaryCta: DepotHeroCta;
  secondaryCta: DepotHeroCta;
};
