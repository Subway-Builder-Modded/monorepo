import type { DocsSuiteConfig } from "../docs/types";
import { BookText, Database, ChartLine } from "lucide-react";
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
      "The official documentation for the Registry powering Subway Builder Modded.",
    heroTitle: "Documentation",
    heroIcon: BookText,
    actions: [
      {
        label: "View Registry",
        href: "https://github.com/Subway-Builder-Modded/registry",
        icon: Database,
        external: true,
      },
      {
        label: "View Analytics",
        href: "/registry/analytics",
        icon: ChartLine,
      },
    ],
  },
};
