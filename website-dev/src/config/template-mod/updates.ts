import type { UpdatesSuiteConfig } from "../updates/types";
import { WandSparkles, BookText } from "lucide-react";
import { UPDATES_CONTENT_ROOT, UPDATES_GITHUB_BASE_URL } from "../updates/shared";

export const templateModUpdatesConfig: UpdatesSuiteConfig = {
  suiteId: "template-mod",
  enabled: true,
  editSourceBaseUrl: `${UPDATES_GITHUB_BASE_URL}/${UPDATES_CONTENT_ROOT}/template-mod/updates`,
  homepage: {
    description: "Release history for the Template Mod starter line.",
    actions: [
      {
        label: "Use Template",
        href: "/template-mod",
        icon: WandSparkles,
      },
      {
        label: "View Documentation",
        href: "/template-mod/docs",
        icon: BookText,
      },
    ],
  },
  changelog: {
    pageActions: [
      {
        label: "Use Template",
        href: ({ entry }) => entry.frontmatter.url,
        icon: WandSparkles,
        external: true,
      },
    ],
  },
};
