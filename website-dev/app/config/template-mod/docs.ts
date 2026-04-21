import type { DocsSuiteConfig } from "../docs/types";
import { WandSparkles, BookText, Megaphone } from "lucide-react";
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
      defaultDoc: "getting-started",
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
      "The official documentation for the Subway Builder Modded Template Mod.",
    heroTitle: "Documentation",
    heroIcon: BookText,
    actions: [
      {
        label: "Create From Template",
        href: "/template-mod",
        icon: WandSparkles,
      },
      {
        label: "View Changelogs",
        href: "/template-mod/updates",
        icon: Megaphone,
      },
    ],
  },
};
