import type { UpdatesSuiteConfig } from "../updates/types";
import { Download, ChartLine, BookText } from "lucide-react";
import { UPDATES_CONTENT_ROOT, UPDATES_GITHUB_BASE_URL } from "../updates/shared";

export const railyardUpdatesConfig: UpdatesSuiteConfig = {
  suiteId: "railyard",
  enabled: true,
  editSourceBaseUrl: `${UPDATES_GITHUB_BASE_URL}/${UPDATES_CONTENT_ROOT}/railyard/updates`,
  homepage: {
    description: "View the changelogs and release notes for Railyard.",
    actions: [
      {
        label: "Download",
        href: "/railyard",
        icon: Download,
      },
      {
        label: "View Documentation",
        href: "/railyard/docs",
        icon: BookText,
      },
      {
        label: "View Analytics",
        href: "/railyard/analytics",
        icon: ChartLine,
      },
    ],
  },
  changelog: {
    pageActions: [
      {
        label: "Download",
        href: ({ entry }) => entry.frontmatter.url,
        icon: Download,
        external: true,
      },
      {
        label: "View Analytics",
        href: ({ suiteId, id }) => `/${suiteId}/analytics/versions/${id}`,
        icon: ChartLine,
      },
    ],
  },
};
