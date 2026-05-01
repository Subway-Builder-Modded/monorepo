import type { DepotHeroContent } from "@/features/depot/depot-types";

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
