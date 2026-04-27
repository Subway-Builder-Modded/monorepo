import type { CreditsSubsectionId } from "@/features/credits";

export const KOFI_MEMBERSHIPS_URL = "https://ko-fi.com/subwaybuildermodded/";

export type SupportTierId = Extract<CreditsSubsectionId, "engineer" | "conductor" | "executive">;

export type SupportTierConfig = {
  id: SupportTierId;
  currencySymbol: string;
  amount: number;
  pitch: string;
  benefits: string[];
  featured?: true;
};

export type ContributeCTAConfig = {
  href: string;
  label: string;
};

export const SUPPORT_TIERS: SupportTierConfig[] = [
  {
    id: "engineer",
    currencySymbol: "$",
    amount: 2,
    pitch: "For those ready to build with us.",
    benefits: [
      "Access to All Release Candidates (Pre-Releases)",
      "Experience Development Plans Before Each Full Release",
      "Access to the Engineer Discord channel",
      "Higher Priority for Feature Requests",
      "Added to Credits as an **Engineer**",
    ],
  },
  {
    id: "conductor",
    currencySymbol: "$",
    amount: 5,
    pitch: "For our core community leaders.",
    benefits: [
      "Access to All Release Candidates (Pre-Releases)",
      "Experience Development Plans Before Each Full Release",
      "Access to the Engineer and Conductor Discord Channels",
      "Higher Priority for Feature Requests",
      "Added to Credits as a **Conductor**",
      "Exclusive Cosmetic Perks & Customizations",
    ],
    featured: true,
  },
  {
    id: "executive",
    currencySymbol: "$",
    amount: 10,
    pitch: "For the visionaries shaping our platform.",
    benefits: [
      "Access to All Release Candidates (Pre-Releases)",
      "Experience Development Plans Before Each Full Release",
      "Access to the Engineer, Conductor, and Executive Discord Channels",
      "Higher Priority for Feature Requests",
      "Added to Credits as an **Executive**",
      "Exclusive Cosmetic Perks & Customizations",
      "Premium and Custom Cosmetic Perks & Customizations",
    ],
  },
];

export const CONTRIBUTE_CTA: ContributeCTAConfig = {
  href: KOFI_MEMBERSHIPS_URL,
  label: "Support On Ko-fi",
};

export const CONTRIBUTE_INTRO = {
  primary:
    "Subway Builder Modded is a passion project that continues to evolve thanks to our community. By becoming a supporter, you'll not only help fund ongoing development, but you'll also gain earlier access to features, help shape a growing community, and have your voice heard in shaping the future of the ecosystem.",
  secondary:
    "All tiers are fully optional and our services will always be free to use. Your support helps us prioritize development and fund server costs.",
} as const;
