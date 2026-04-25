import { FileQuestion, ExternalLink, Check, HeartHandshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  PageHeading,
  SuiteAccentScope,
  SectionSeparator,
} from "@subway-builder-modded/shared-ui";
import { useLocation } from "@/lib/router";
import { getMatchingItem, getSuiteById } from "@/config/site-navigation";
import { matchContributeRoute } from "@/features/contribute/lib/routing";
import { getTierStyle } from "@/features/credits/lib/tier-styles";
import type { CreditsSubsectionId } from "@/features/credits/lib/types";
import { KOFI_MEMBERSHIPS_URL } from "@/config/shared/support";

type SupporterTier = {
  id: Extract<CreditsSubsectionId, "engineer" | "conductor" | "executive">;
  monthlyAmount: string;
  pitch: string;
  benefits: string[];
};

const SUPPORTER_TIERS: SupporterTier[] = [
  {
    id: "engineer",
    monthlyAmount: "$3",
    pitch: "Lay the track. Every contribution helps keep development on schedule.",
    benefits: [
      "Name shown in contributor credits",
      "Access to supporter channels",
    ],
  },
  {
    id: "conductor",
    monthlyAmount: "$7",
    pitch: "Lead the line. Your support helps keep regular updates on track.",
    benefits: [
      "All Engineer benefits",
      "Early access to development announcements",
      "Exclusive Conductor role",
    ],
  },
  {
    id: "executive",
    monthlyAmount: "$15",
    pitch: "Run the network. Your support makes long-term development possible.",
    benefits: [
      "All Conductor benefits",
      "Exclusive Executive role",
      "Priority feedback access",
    ],
  },
];

function TierCard({ tier }: { tier: SupporterTier }) {
  const { icon: Icon, accentLight, accentDark } = getTierStyle(tier.id);
  const tierName = tier.id.charAt(0).toUpperCase() + tier.id.slice(1);

  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/70 shadow-sm backdrop-blur-sm"
      data-testid={`contribute-tier-card-${tier.id}`}
      style={
        {
          "--tier-accent-light": accentLight,
          "--tier-accent-dark": accentDark,
        } as React.CSSProperties
      }
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] bg-[var(--tier-accent-light)] dark:bg-[var(--tier-accent-dark)]"
        aria-hidden="true"
      />

      {/* Header section */}
      <div className="flex flex-col px-7 pb-6 pt-8 sm:px-8 sm:pt-9">
        {/* Icon */}
        <span
          className="mb-5 inline-flex size-12 shrink-0 items-center justify-center rounded-[0.7rem] border border-[color-mix(in_srgb,var(--tier-accent-light)_30%,transparent)] bg-[color-mix(in_srgb,var(--tier-accent-light)_12%,transparent)] text-[var(--tier-accent-light)] dark:border-[color-mix(in_srgb,var(--tier-accent-dark)_36%,transparent)] dark:bg-[color-mix(in_srgb,var(--tier-accent-dark)_16%,transparent)] dark:text-[var(--tier-accent-dark)]"
          aria-hidden="true"
        >
          <Icon className="size-5.5" />
        </span>

        {/* Tier label */}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-[var(--tier-accent-light)] dark:text-[var(--tier-accent-dark)]">
          {tierName}
        </p>

        {/* Price */}
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-[clamp(2.1rem,3.5vw,2.7rem)] font-extrabold leading-none tracking-tight text-foreground">
            {tier.monthlyAmount}
          </span>
          <span className="text-sm font-medium text-muted-foreground">/ month</span>
        </div>

        {/* Pitch */}
        <p className="mt-3.5 text-[clamp(0.85rem,1.1vw,0.95rem)] leading-relaxed text-muted-foreground">
          {tier.pitch}
        </p>
      </div>

      {/* Divider */}
      <div className="mx-7 h-px shrink-0 bg-border/55 sm:mx-8" aria-hidden="true" />

      {/* Benefits */}
      <div className="flex flex-1 flex-col px-7 pb-8 pt-5 sm:px-8 sm:pb-9">
        <ul className="space-y-3.5" aria-label={`${tierName} tier benefits`}>
          {tier.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-[var(--tier-accent-light)] dark:text-[var(--tier-accent-dark)]"
                aria-hidden="true"
              />
              <span className="text-[clamp(0.83rem,1.05vw,0.93rem)] leading-snug text-foreground/80">
                {benefit}
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
        <FileQuestion className="size-[clamp(1.9rem,5.5vw,3rem)] text-muted-foreground" aria-hidden="true" />
        <h1 className="text-[clamp(1rem,2.2vw,1.2rem)] font-bold text-foreground">Page Not Found</h1>
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

        <div className="mt-[clamp(2rem,4.5vw,3.5rem)] space-y-[clamp(3rem,6vw,5rem)]">
          {/* Intro */}
          <div className="max-w-[58ch]">
            <p className="text-[clamp(1rem,1.55vw,1.15rem)] leading-relaxed text-muted-foreground">
              Subway Builder Modded is maintained by a small team of volunteers. Your support funds
              development time, tooling, and hosting—keeping everything free and moving forward for
              the whole community.
            </p>
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
              {SUPPORTER_TIERS.map((tier) => (
                <TierCard key={tier.id} tier={tier} />
              ))}
            </div>
          </div>

          {/* Central CTA */}
          <div
            className="border-t border-border/55 pt-[clamp(2rem,4.5vw,3.5rem)]"
            data-testid="contribute-cta-section"
          >
            <div className="flex flex-col items-center gap-[clamp(1rem,2vw,1.5rem)] text-center">
              <div className="max-w-[48ch]">
                <p className="text-[clamp(1.05rem,1.6vw,1.2rem)] font-semibold text-foreground">
                  Ready to support?
                </p>
                <p className="mt-2 text-[clamp(0.85rem,1.1vw,0.95rem)] leading-relaxed text-muted-foreground">
                  All tiers are available through Ko-fi Memberships. Supporter
                  benefits—including credits and role access—are applied within 24 hours.
                </p>
              </div>

              <a
                href={KOFI_MEMBERSHIPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/40"
                data-testid="contribute-cta-link"
                aria-label="Support on Ko-fi — opens Ko-fi memberships page"
              >
                <ExternalLink
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
                Support on Ko-fi
              </a>
            </div>
          </div>
        </div>
      </section>
    </SuiteAccentScope>
  );
}
