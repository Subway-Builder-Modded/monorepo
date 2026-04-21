import type { DocsSuiteConfig } from "../docs/types";
import { DOCS_GITHUB_BASE_URL, DOCS_CONTENT_ROOT } from "../docs/shared";

export const railyardDocsConfig: DocsSuiteConfig = {
  suiteId: "railyard",
  enabled: true,
  versioned: true,
  editSourceBaseUrl: `${DOCS_GITHUB_BASE_URL}/${DOCS_CONTENT_ROOT}/railyard`,
  latestVersion: "v0.2",
  versions: [
    {
      value: "v0.2",
      label: "v0.2",
      status: "latest",
      defaultDoc: "players",
      releaseDate: "2026-03-15",
    },
    {
      value: "v0.1",
      label: "v0.1",
      status: "deprecated",
      defaultDoc: "players",
      releaseDate: "2026-01-20",
    },
  ],
  sidebarOrderByVersion: {
    "v0.2": [
      {
        key: "players",
        children: [
          {
            key: "installing-railyard",
            children: ["windows", "macos", "linux"],
          },
          "github-token",
          "country-flag-emojis",
          "importing-custom-assets",
          "profile-management",
        ],
      },
    ],
    "v0.1": [
      {
        key: "players",
        children: [
          "install-guide-windows",
          "install-guide-macos",
          "install-guide-linux",
          "github-token",
        ],
      },
    ],
  },
  homepage: {
    description:
      "The official documentation for Railyard, the all-in-one mod and map manager for Subway Builder.",
    heroTitle: "Railyard Docs",
    actions: [
      {
        label: "Download Railyard",
        href: "/railyard/download",
        variant: "solid",
      },
      {
        label: "Railyard Source",
        href: "https://github.com/Subway-Builder-Modded/monorepo/tree/main/railyard",
        variant: "outline",
        external: true,
      },
    ],
  },
};
