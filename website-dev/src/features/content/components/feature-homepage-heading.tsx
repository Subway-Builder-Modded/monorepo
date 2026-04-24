import type { LucideIcon } from "lucide-react";
import { PageHeading, SuiteBadge } from "@subway-builder-modded/shared-ui";
import type { SiteSuiteId } from "@/config/site-navigation";
import { getSuiteById } from "@/config/site-navigation";
import { PageHeadingActions } from "@/features/content/components/page-heading-actions";
import type { ResolvedHeadingActionConfig } from "@/config/shared/heading-actions";

/**
 * Badge class shared by all feature-homepage headings (docs, updates, …).
 * Kept here so it drifts in exactly one place.
 */
export const FEATURE_HOMEPAGE_BADGE_CLASS =
  "h-7 shrink-0 self-center gap-1.5 rounded-md px-2 normal-case tracking-normal";

type FeatureHomepageHeadingProps = {
  title: string;
  /** Feature icon (e.g. BookText for docs, Megaphone for updates). */
  icon: LucideIcon;
  suiteId: SiteSuiteId;
  description?: string;
  actions?: ResolvedHeadingActionConfig[];
  footer?: React.ReactNode;
  /**
   * Optional data-testid placed on the rendered feature icon element.
   * Used by docs tests to locate the hero icon.
   */
  iconTestId?: string;
};

/**
 * Standardised hero heading for feature homepages (docs, updates).
 *
 * Renders a `PageHeading` with:
 * - the feature icon (+ optional testid)
 * - the feature-global title
 * - a suite badge derived from `suiteId`
 * - optional resolved actions via `PageHeadingActions`
 * - an optional footer slot (used by docs for the version chooser)
 */
export function FeatureHomepageHeading({
  title,
  icon: Icon,
  suiteId,
  description,
  actions,
  footer,
  iconTestId,
}: FeatureHomepageHeadingProps) {
  const suite = getSuiteById(suiteId);
  const SuiteIcon = suite.icon;

  const HeadingIcon = ((props: { className?: string; "aria-hidden"?: boolean }) => (
    <Icon {...props} {...(iconTestId ? { "data-testid": iconTestId } : {})} />
  )) as typeof Icon;

  return (
    <PageHeading
      icon={HeadingIcon}
      title={title}
      description={description}
      badge={
        <SuiteBadge className={FEATURE_HOMEPAGE_BADGE_CLASS} accent={suite.accent}>
          <SuiteIcon className="size-3.5" aria-hidden={true} />
          <span className="max-w-[8rem] truncate">{suite.title}</span>
        </SuiteBadge>
      }
      actions={
        actions && actions.length > 0 ? <PageHeadingActions actions={actions} hideOnSmall /> : null
      }
      footer={footer}
    />
  );
}
