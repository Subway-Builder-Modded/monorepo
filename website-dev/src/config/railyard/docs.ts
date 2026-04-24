import type { DocsSuiteConfig } from "../docs/types";
import { ChartLine, Download, Megaphone } from "lucide-react";
import { DOCS_GITHUB_BASE_URL, DOCS_CONTENT_ROOT } from "../docs/shared";

export const railyardDocsConfig: DocsSuiteConfig = {
  suiteId: "railyard",
  enabled: true,
  versioned: true,
  editSourceBaseUrl: `${DOCS_GITHUB_BASE_URL}/${DOCS_CONTENT_ROOT}/railyard/docs`,
  latestVersion: "v0.2",
  versions: [
    {
      value: "v0.2",
      label: "v0.2",
      status: "latest",
      defaultDoc: "installing-railyard",
      releaseDate: "2026-03-15",
    },
    {
      value: "v0.1",
      label: "v0.1",
      status: "deprecated",
      defaultDoc: "install-guide-windows",
      releaseDate: "2026-01-20",
    },
  ],
  sidebarOrderByVersion: {
    "v0.2": [
      {
        key: "installing-railyard",
        children: ["windows", "macos", "linux"],
      },
      "troubleshooting-railyard",
      "github-token",
      "importing-local-assets",
      "profile-management",
      "country-flag-emojis",
    ],
    "v0.1": ["install-guide-windows", "install-guide-macos", "install-guide-linux"],
  },
  homepage: {
    actions: [
      {
        label: "Download",
        href: "/railyard",
        icon: Download,
      },
      {
        label: "View Updates",
        href: "/railyard/updates",
        icon: Megaphone,
      },
      {
        label: "View Analytics",
        href: "/railyard/analytics",
        icon: ChartLine,
      },
    ],
  },
};
