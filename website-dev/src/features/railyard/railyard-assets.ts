import type { RailyardBridgeCard, RailyardStoryStep } from "./railyard-types";

export const railyardHeroImage = {
  light: "/images/railyard/hero-light.png",
  dark: "/images/railyard/hero-dark.png",
  alt: "Railyard desktop app interface",
  focalPointLight: "64% 44%",
  focalPointDark: "64% 44%",
} as const;

export const railyardAppPreviewImages = {
  browse: {
    light: "/images/railyard/browse-light.png",
    dark: "/images/railyard/browse-dark.png",
    alt: "Browsing maps and mods in Railyard",
  },
  listing: {
    light: "/images/railyard/listing-light.png",
    dark: "/images/railyard/listing-dark.png",
    alt: "Viewing a registry listing in Railyard before download",
  },
  library: {
    light: "/images/railyard/library-light.png",
    dark: "/images/railyard/library-dark.png",
    alt: "Managing installed content in the Railyard library",
  },
} as const;

export const railyardRegistryPreviewImage = {
  light: "/images/railyard/registry-analytics-light.png",
  dark: "/images/railyard/registry-analytics-dark.png",
  alt: "Registry view showing discoverable Subway Builder Modded content",
} as const;

export const railyardStorySteps: RailyardStoryStep[] = [
  {
    id: "browse",
    icon: "Search",
    title: "Browse Registry",
    description:
      "Browse the full GitHub-powered Registry to find what you're looking for. With comprehensive filters and sort options, you can find what you need with ease.",
    imageLight: railyardAppPreviewImages.browse.light,
    imageDark: railyardAppPreviewImages.browse.dark,
    imageAlt: railyardAppPreviewImages.browse.alt,
  },
  {
    id: "install",
    icon: "Download",
    title: "Install Content",
    description:
      "Easily install content directly within the app. All you have to do is decide what content to play with, and Railyard will handle the rest.",
    imageLight: railyardAppPreviewImages.listing.light,
    imageDark: railyardAppPreviewImages.listing.dark,
    imageAlt: railyardAppPreviewImages.listing.alt,
  },
  {
    id: "organize",
    icon: "LibraryBig",
    title: "Stay Organized",
    description:
      "Keep all of your installed content organized in one place. Manage everything with the click of a button, and keep everything in order.",
    imageLight: railyardAppPreviewImages.library.light,
    imageDark: railyardAppPreviewImages.library.dark,
    imageAlt: railyardAppPreviewImages.library.alt,
  },
];

export const railyardBridgeCards: RailyardBridgeCard[] = [
  {
    id: "railyard-docs",
    title: "User Guides & Troubleshooting",
    description:
      "Find setup steps, troubleshooting guidance, and additional tips and tricks for using Railyard to its fullest.",
    href: "/railyard/docs",
  },
  {
    id: "registry-docs",
    title: "Creator Guides & Submission Process",
    description:
      "Learn how to efficiently publish your content to the Registry for download on Railyard.",
    href: "/registry/docs",
  },
];
