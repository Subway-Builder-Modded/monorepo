import type { SiteSuiteId } from "@/config/site-navigation";
import type { HeadingActionConfig, HeadingActions } from "@/config/shared/heading-actions";

export type UpdatesSuiteId = Extract<SiteSuiteId, "railyard" | "template-mod" | "website">;

export type UpdatesTag = "alpha" | "beta" | "release";

export type UpdatesTagPresentation = {
  label: string;
  toneClassName: string;
};

export type UpdatesFrontmatter = {
  title: string;
  icon: string;
  date: string;
  tag: UpdatesTag;
  url?: string;
  previousVersion?: string;
  compareUrl?: string;
};

export type UpdatesHomepageActionContext = {
  suiteId: UpdatesSuiteId;
};

export type UpdatesChangelogActionContext = {
  suiteId: UpdatesSuiteId;
  id: string;
  isParentVersion: boolean;
  entry: {
    id: string;
    frontmatter: UpdatesFrontmatter;
  };
};

export type UpdatesHomepageActionConfig = HeadingActionConfig<UpdatesHomepageActionContext>;

export type UpdatesChangelogActionConfig = HeadingActionConfig<UpdatesChangelogActionContext>;

export type UpdatesHomepageActions = HeadingActions<UpdatesHomepageActionContext>;

export type UpdatesChangelogActions = HeadingActions<UpdatesChangelogActionContext>;

export type UpdatesSuiteConfig = {
  suiteId: UpdatesSuiteId;
  enabled: boolean;
  editSourceBaseUrl: string;
  changelog: {
    pageActions?: UpdatesChangelogActions;
  };
  homepage: {
    description?: string;
    actions?: UpdatesHomepageActions;
  };
};

export type UpdatesConfig = {
  suites: Record<UpdatesSuiteId, UpdatesSuiteConfig>;
};
