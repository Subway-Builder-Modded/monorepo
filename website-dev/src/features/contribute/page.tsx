import { FileQuestion, Check, HeartHandshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  PageHeading,
  SuiteAccentScope,
  SuiteAccentButton,
  SectionSeparator,
  InlineMarkdown,
} from "@subway-builder-modded/shared-ui";
import { KofiIcon } from "@subway-builder-modded/icons";
import { useLocation } from "@/lib/router";
import { getMatchingItem, getSuiteById } from "@/config/site-navigation";
import { matchContributeRoute } from "@/features/contribute/lib/routing";
import { getTierStyle } from "@/features/credits/lib/tier-styles";
import { SUPPORT_TIERS, CONTRIBUTE_CTA, CONTRIBUTE_INTRO } from "@/config/contribute";
import type { SupportTierConfig, SupportTierId } from "@/config/contribute";
import { cn } from "@/lib/utils";

// Per-tier vertical crop: container is 5:3 on a square image → 40% of height is
// hidden. objectPositionY = (topCut / 40) * 100
const TIER_IMAGE_CROP: Record<SupportTierId, string> = {
  engineer: "87.5%", // 35% top, 5% bottom
  conductor: "50%", // 20% top, 20% bottom
  executive: "37.5%", // 15% top, 25% bottom
};

function TierCard({ tier }: { tier: SupportTierConfig }) {
  const { icon: Icon, accentLight, accentDark } = getTierStyle(tier.id);
  const tierName = tier.id.charAt(0).toUpperCase() + tier.id.slice(1);

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl backdrop-blur-sm",
        tier.featured
          ? "border border-[color-mix(in_srgb,var(--tier-accent-light)_48%,transparent)] bg-background shadow-lg dark:border-[color-mix(in_srgb,var(--tier-accent-dark)_48%,transparent)] md:-my-3 md:z-10"
          : "border border-border/70 bg-background/70 shadow-sm",
      )}
      data-testid={`contribute-tier-card-${tier.id}`}
      style={
        {
          "--tier-accent-light": accentLight,
          "--tier-accent-dark": accentDark,
        } as React.CSSProperties
      }
    >
      {/* Top accent bar — thicker for featured */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 bg-[var(--tier-accent-light)] dark:bg-[var(--tier-accent-dark)]",
          tier.featured ? "h-[3px]" : "h-[2px]",
        )}
        aria-hidden="true"
      />

      {/* Subtle glow for featured */}
      {tier.featured && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[var(--tier-accent-light)] to-transparent opacity-[0.06] dark:from-[var(--tier-accent-dark)]"
          aria-hidden="true"
        />
      )}

      {/* Tier illustration */}
      <div className="relative aspect-[5/3] w-full overflow-hidden">
        <img
          src={`/images/contribute/${tier.id}.png`}
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
          style={{ objectPosition: `50% ${TIER_IMAGE_CROP[tier.id]}` }}
        />
      </div>

      {/* Card header: unboxed icon + overline + price + description */}
      <div
        className={cn(
          "flex flex-col px-7 sm:px-8",
          tier.featured ? "pb-7 pt-9 sm:pt-10" : "pb-6 pt-8",
        )}
      >
        <div className="flex items-start gap-4">
          <Icon
            className="mt-1 size-[clamp(1.6rem,2.6vw,2.1rem)] shrink-0 text-[var(--tier-accent-light)] dark:text-[var(--tier-accent-dark)]"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            {/* Role title / overline — matches footer column title style */}
            <span
              aria-hidden="true"
              className="mb-1 block h-0.5 w-8 rounded-full bg-[var(--tier-accent-light)] dark:bg-[var(--tier-accent-dark)]"
            />
            <p className="text-xs font-semibold uppercase leading-tight tracking-[0.14em] text-[var(--tier-accent-light)] dark:text-[var(--tier-accent-dark)]">
              {tierName}
            </p>

            {/* Price — dominant header text */}
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-[clamp(2rem,3.2vw,2.6rem)] font-extrabold leading-none tracking-tight text-foreground">
                <span className="text-[0.55em] font-bold align-top mt-[0.18em] inline-block mr-0.5">
                  {tier.currencySymbol}
                </span>
                {tier.amount}
              </span>
              <span className="text-sm font-medium text-muted-foreground">/ month</span>
            </div>

            {/* Description */}
            <p className="mt-3 text-[clamp(0.85rem,1.1vw,0.93rem)] leading-relaxed text-muted-foreground">
              {tier.pitch}
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-7 h-px shrink-0 bg-border/55 sm:mx-8" aria-hidden="true" />

      {/* Benefits */}
      <div
        className={cn(
          "flex flex-1 flex-col px-7 sm:px-8",
          tier.featured ? "pb-9 pt-5 sm:pb-10" : "pb-8 pt-5",
        )}
      >
        <ul className="space-y-3.5" aria-label={`${tierName} tier benefits`}>
          {tier.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-[var(--tier-accent-light)] dark:text-[var(--tier-accent-dark)]"
                aria-hidden="true"
              />
              <span className="text-[clamp(0.83rem,1.05vw,0.93rem)] leading-snug text-foreground/80">
                <InlineMarkdown>{benefit}</InlineMarkdown>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function ContributeRoute() {
  const location = useLocation();
  const match = matchContributeRoute(location.pathname);

  if (match.kind !== "page") {
    return null;
  }

  const navItem = getMatchingItem(location.pathname, "general");

  if (!navItem) {
    return (
      <div className="flex flex-col items-center gap-[clamp(0.65rem,1.5vw,1rem)] py-[clamp(2rem,8vw,5rem)] text-center">
        <FileQuestion
          className="size-[clamp(1.9rem,5.5vw,3rem)] text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="text-[clamp(1rem,2.2vw,1.2rem)] font-bold text-foreground">
          Page Not Found
        </h1>
        <p className="text-[clamp(0.85rem,1.2vw,1rem)] text-muted-foreground">
          The page "{location.pathname}" was not found.
        </p>
      </div>
    );
  }

  const Icon = navItem.icon as LucideIcon;
  const suite = getSuiteById(navItem.suiteId);

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-[clamp(1.1rem,3vw,2rem)]">
        {/* Standardized title card */}
        <PageHeading icon={Icon} title={navItem.title} description={navItem.description} />

        <div className="mt-[clamp(2.5rem,5vw,4rem)] space-y-[clamp(3.5rem,7vw,5.5rem)]">
          {/* Centered intro text + Ko-fi CTA */}
          <div className="mx-auto text-center" data-testid="contribute-intro-section">
            <p className="text-[clamp(0.97rem,1.45vw,1.1rem)] leading-relaxed text-foreground">
              {CONTRIBUTE_INTRO.primary}
            </p>
            <p className="mt-[clamp(0.75rem,1.4vw,1rem)] text-[clamp(0.85rem,1.1vw,0.97rem)] leading-relaxed text-muted-foreground">
              {CONTRIBUTE_INTRO.secondary}
            </p>

            {/* Ko-fi CTA — sits directly beneath the centered intro */}
            <div className="mt-[clamp(1.5rem,3vw,2.25rem)]">
              <SuiteAccentButton
                tone="solid"
                asChild
                className="h-11 gap-2.5 px-7 text-[15px] font-bold"
              >
                <a
                  href={CONTRIBUTE_CTA.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Support on Ko-fi — opens Ko-fi memberships page"
                  data-testid="contribute-cta-link"
                >
                  <KofiIcon className="size-6" />
                  {CONTRIBUTE_CTA.label}
                </a>
              </SuiteAccentButton>
            </div>
          </div>

          {/* Tier centerpiece */}
          <div>
            <SectionSeparator
              label="Support Tiers"
              icon={HeartHandshake}
              headingLevel={2}
              className="mb-[clamp(1.5rem,3vw,2.5rem)]"
            />

            <div
              className="grid grid-cols-1 gap-[clamp(1rem,2vw,1.5rem)] md:grid-cols-3"
              data-testid="contribute-tiers-grid"
            >
              {SUPPORT_TIERS.map((tier) => (
                <TierCard key={tier.id} tier={tier} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </SuiteAccentScope>
  );
}
