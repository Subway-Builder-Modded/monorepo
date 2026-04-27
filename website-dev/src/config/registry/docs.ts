import type { DocsSuiteConfig } from "../docs/types";
import { Database, ChartLine } from "lucide-react";
import { DOCS_GITHUB_BASE_URL, DOCS_CONTENT_ROOT } from "../docs/shared";
export const registryDocsConfig: DocsSuiteConfig = {
  suiteId: "registry",
  enabled: true,
  versioned: false,
  editSourceBaseUrl: `${DOCS_GITHUB_BASE_URL}/${DOCS_CONTENT_ROOT}/registry/docs`,
  sidebarOrder: [
    "publishing-content",
    "updating-content",
    "using-custom-url",
    "dependencies",
    "author-attribution",
    "tagging",
    "data-quality",
    "analytics-overview",
    "markdown-playground",
  ],
  homepage: {
    actions: [
      {
        label: "View Registry",
        href: "/registry",
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
