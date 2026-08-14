import type { DocsSuiteConfig } from "../docs/types";
import { Database, ChartLine } from "lucide-react";
import { DOCS_GITHUB_BASE_URL, DOCS_CONTENT_ROOT } from "../docs/shared";
export const registryDocsConfig: DocsSuiteConfig = {
  suiteId: "registry",
  enabled: true,
  versioned: false,
  editSourceBaseUrl: `${DOCS_GITHUB_BASE_URL}/${DOCS_CONTENT_ROOT}/registry/docs`,
  // Children may name a top-level slug: grouping here is presentational, so
  // pages keep the URLs they were published under.
  sidebarOrder: [
    {
      key: "publishing",
      children: [
        "publishing-content",
        "manifest-requirements",
        "using-custom-url",
        "tagging",
        "dependencies",
      ],
    },
    {
      key: "lifecycle",
      children: ["updating-content", "retiring-versions", "deprecation"],
    },
    {
      key: "ownership",
      children: ["collaborators", "caretakers", "author-attribution"],
    },
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
