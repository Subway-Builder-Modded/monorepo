import type { DocsSuiteConfig } from "@/app/config/docs/types";
import { DOCS_GITHUB_BASE_URL, DOCS_CONTENT_ROOT } from "@/app/config/docs/shared";

export const registryDocsConfig: DocsSuiteConfig = {
  suiteId: "registry",
  enabled: true,
  editSourceBaseUrl: `${DOCS_GITHUB_BASE_URL}/${DOCS_CONTENT_ROOT}/registry`,
  latestVersion: "v1.0",
  versions: [
    {
      value: "v1.0",
      label: "v1.0",
      status: "latest",
      releaseDate: "2026-03-15",
    },
  ],
  sidebarOrder: {
    "v1.0": [
      "publishing-projects",
      "using-custom-url",
      "tagging",
      "data-quality",
      "dependencies",
    ],
  },
  homepage: {
    description:
      "The official documentation for the Railyard Registry, the community-driven asset store for Subway Builder maps and mods.",
    heroTitle: "Registry Docs",
  },
};
