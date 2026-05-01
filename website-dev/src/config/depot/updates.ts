import type { UpdatesSuiteConfig } from "../updates/types";
import { UPDATES_CONTENT_ROOT, UPDATES_GITHUB_BASE_URL } from "../updates/shared";

export const depotUpdatesConfig: UpdatesSuiteConfig = {
  suiteId: "depot",
  enabled: true,
  editSourceBaseUrl: `${UPDATES_GITHUB_BASE_URL}/${UPDATES_CONTENT_ROOT}/depot/updates`,
  homepage: {},
  changelog: {},
};
