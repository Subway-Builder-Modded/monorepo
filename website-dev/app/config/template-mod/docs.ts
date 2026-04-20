import type { DocsSuiteConfig } from "../docs/types";
import { DOCS_GITHUB_BASE_URL, DOCS_CONTENT_ROOT } from "../docs/shared";

export const templateModDocsConfig: DocsSuiteConfig = {
  suiteId: "template-mod",
  enabled: true,
  versioned: true,
  editSourceBaseUrl: `${DOCS_GITHUB_BASE_URL}/${DOCS_CONTENT_ROOT}/template-mod`,
  latestVersion: "v1.0",
  versions: [
    {
      value: "v1.0",
      label: "v1.0",
      status: "latest",
      releaseDate: "2026-02-10",
    },
  ],
  sidebarOrderByVersion: {
    "v1.0": [
      "getting-started",
      "project-structure",
      "common-patterns",
      "react-components",
      "debugging",
      "type-reference",
    ],
  },
  homepage: {
    description:
      "The official documentation for the Template Mod, the all-inclusive TypeScript template for creating Subway Builder mods.",
    heroTitle: "Template Mod Docs",
  },
};
