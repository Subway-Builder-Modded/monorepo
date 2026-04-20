import type { DocsSuiteConfig } from "@/app/features/docs/config/types";
import { DOCS_GITHUB_BASE_URL, DOCS_CONTENT_ROOT } from "@/app/features/docs/config/shared";

export const railyardDocsConfig: DocsSuiteConfig = {
  suiteId: "railyard",
  enabled: true,
  editSourceBaseUrl: `${DOCS_GITHUB_BASE_URL}/${DOCS_CONTENT_ROOT}/railyard`,
  latestVersion: "v0.2",
  versions: [
    {
      value: "v0.2",
      label: "v0.2",
      status: "latest",
      releaseDate: "2026-03-15",
    },
    {
      value: "v0.1",
      label: "v0.1",
      status: "deprecated",
      releaseDate: "2026-01-20",
    },
  ],
  sidebarOrder: {
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
      {
        key: "developers",
        children: [
          "publishing-projects",
          "using-custom-url",
          "tagging",
          "data-quality",
          "dependencies",
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
      {
        key: "developers",
        children: ["publishing-projects", "using-custom-url", "data-quality"],
      },
    ],
  },
  homepage: {
    description:
      "The official documentation for Railyard, the all-in-one mod and map manager for Subway Builder.",
    heroTitle: "Railyard Docs",
  },
};
