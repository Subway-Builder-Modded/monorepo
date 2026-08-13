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
    "deprecation",
    "retiring-versions",
    "using-custom-url",
    "manifest-requirements",
    "collaborators",
    "caretakers",
    "dependencies",
    "author-attribution",
    "tagging",
    {
      key: "data-quality",
      children: ["overview", "submission-questions", "scoring-rubric", "quality-floor"],
    },
    "markdown-playground",
  ],
  homepage: {
    actions: [
      {
        label: "View Registry",
        href: "/registry",
        icon: Database,
      },
      {
        label: "View Analytics",
        href: "/registry/analytics",
        icon: ChartLine,
      },
    ],
  },
};
