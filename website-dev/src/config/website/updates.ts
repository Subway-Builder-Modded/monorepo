import type { UpdatesSuiteConfig } from "../updates/types";
import { Globe, ChartLine } from "lucide-react";
import { UPDATES_CONTENT_ROOT, UPDATES_GITHUB_BASE_URL } from "../updates/shared";

export const websiteUpdatesConfig: UpdatesSuiteConfig = {
  suiteId: "website",
  enabled: true,
  editSourceBaseUrl: `${UPDATES_GITHUB_BASE_URL}/${UPDATES_CONTENT_ROOT}/website/updates`,
  homepage: {
    actions: [
      {
        label: "View Analytics",
        href: "/website/analytics",
        icon: ChartLine,
      },
    ],
  },
  changelog: {
  },
};
