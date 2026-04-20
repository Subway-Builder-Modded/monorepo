import type { DocsSuiteConfig } from "../docs/types";
import { DOCS_GITHUB_BASE_URL, DOCS_CONTENT_ROOT } from "../docs/shared";
export const registryDocsConfig: DocsSuiteConfig = {
  suiteId: "registry",
  enabled: true,
  versioned: false,
  editSourceBaseUrl: `${DOCS_GITHUB_BASE_URL}/${DOCS_CONTENT_ROOT}/registry`,
  sidebarOrder: [
    "publishing-projects",
    "using-custom-url",
    "tagging",
    "data-quality",
    "dependencies",
  ],
  homepage: {
    description:
      "The official documentation for the Railyard Registry, the community-driven asset store for Subway Builder maps and mods.",
    heroTitle: "Registry Docs",
  },
};
