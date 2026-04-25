import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContributeRoute } from "@/features/contribute/page";
import {
  KOFI_MEMBERSHIPS_URL,
  SUPPORT_TIERS,
  CONTRIBUTE_CTA,
  CONTRIBUTE_INTRO,
} from "@/config/contribute";
import { TIER_STYLES } from "@/features/credits/lib/tier-styles";
import { resolvePageMetadata } from "@/config/page-metadata";

vi.mock("@/lib/router", () => ({
  useLocation: () => ({ pathname: "/contribute" }),
}));

describe("ContributeRoute", () => {
  it("renders the standardized page heading from site navigation identity", () => {
    render(<ContributeRoute />);

    expect(screen.getByRole("heading", { name: "Contribute" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Help us build the future of Subway Builder Modded. Your support keeps the project going.",
      ),
    ).toBeInTheDocument();
  });

  it("page identity comes from the standardized site navigation source", () => {
    render(<ContributeRoute />);

    // The heading text and description must match what is defined in
    // SITE_NAV_ITEMS for 'general-contribute' — not local overrides.
    const heading = screen.getByRole("heading", { name: "Contribute" });
    expect(heading).toBeInTheDocument();
  });

  // ── Centered intro ────────────────────────────────────────────────────────

  it("renders a centered intro section", () => {
    render(<ContributeRoute />);

    expect(screen.getByTestId("contribute-intro-section")).toBeInTheDocument();
  });

  it("intro renders the primary paragraph with main text color", () => {
    render(<ContributeRoute />);

    const introSection = screen.getByTestId("contribute-intro-section");
    const p1 = within(introSection).getByText(CONTRIBUTE_INTRO.primary);
    expect(p1).toBeInTheDocument();
    expect(p1.className).toContain("text-foreground");
    expect(p1.className).not.toContain("text-muted-foreground");
  });

  it("intro renders the secondary muted paragraph", () => {
    render(<ContributeRoute />);

    const introSection = screen.getByTestId("contribute-intro-section");
    const p2 = within(introSection).getByText(CONTRIBUTE_INTRO.secondary);
    expect(p2).toBeInTheDocument();
    expect(p2.className).toContain("text-muted-foreground");
  });

  // ── Ko-fi CTA placement ───────────────────────────────────────────────────

  it("Ko-fi CTA link is inside the intro section (not at page bottom)", () => {
    render(<ContributeRoute />);

    const introSection = screen.getByTestId("contribute-intro-section");
    const ctaLink = within(introSection).getByTestId("contribute-cta-link");
    expect(ctaLink).toBeInTheDocument();
  });

  it("Ko-fi CTA link has correct href, target and rel attributes", () => {
    render(<ContributeRoute />);

    const ctaLink = screen.getByTestId("contribute-cta-link");
    expect(ctaLink).toHaveAttribute("href", KOFI_MEMBERSHIPS_URL);
    expect(ctaLink).toHaveAttribute("target", "_blank");
    expect(ctaLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("CTA button label comes from CONTRIBUTE_CTA config", () => {
    render(<ContributeRoute />);

    const ctaLink = screen.getByTestId("contribute-cta-link");
    expect(ctaLink).toHaveTextContent(CONTRIBUTE_CTA.label);
  });

  it("renders exactly one CTA link on the page", () => {
    render(<ContributeRoute />);

    const ctaLinks = screen.getAllByTestId("contribute-cta-link");
    expect(ctaLinks).toHaveLength(1);
  });

  it("does NOT render the old lower cta section", () => {
    render(<ContributeRoute />);

    expect(screen.queryByTestId("contribute-cta-section")).not.toBeInTheDocument();
  });

  // ── Tier cards ────────────────────────────────────────────────────────────

  it("renders all 3 supporter tier cards from config", () => {
    render(<ContributeRoute />);

    for (const tier of SUPPORT_TIERS) {
      expect(screen.getByTestId(`contribute-tier-card-${tier.id}`)).toBeInTheDocument();
    }
  });

  it("renders exactly 3 tier cards — no extras", () => {
    render(<ContributeRoute />);

    const grid = screen.getByTestId("contribute-tiers-grid");
    const cards = within(grid).getAllByRole("article");
    expect(cards).toHaveLength(3);
  });

  it("tier card content is driven by SUPPORT_TIERS config", () => {
    render(<ContributeRoute />);

    for (const tier of SUPPORT_TIERS) {
      const card = screen.getByTestId(`contribute-tier-card-${tier.id}`);
      // Price — currency symbol and number are in separate styled spans
      const digits = tier.monthlyAmount.replace(/\D+/, "");
      const symbol = tier.monthlyAmount.replace(/\d+/, "");
      expect(within(card).getByText(digits)).toBeInTheDocument();
      expect(within(card).getByText(symbol)).toBeInTheDocument();
      // Pitch
      expect(within(card).getByText(tier.pitch)).toBeInTheDocument();
      // Benefits — strip markdown syntax for text matching since InlineMarkdown
      // splits styled tokens into separate DOM nodes; check via textContent
      for (const benefit of tier.benefits) {
        const plainText = benefit.replace(
          /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|~~(.+?)~~/g,
          "$1$2$3$4$5",
        );
        expect(card.textContent).toContain(plainText);
      }
    }
  });

  it("tier cards use accent CSS variables from the shared TIER_STYLES source", () => {
    render(<ContributeRoute />);

    for (const tierId of ["engineer", "conductor", "executive"] as const) {
      const card = screen.getByTestId(`contribute-tier-card-${tierId}`);
      const style = card.getAttribute("style") ?? "";
      expect(style).toContain(TIER_STYLES[tierId].accentLight);
    }
  });

  it("card icons are NOT wrapped in a container box (unboxed layout)", () => {
    render(<ContributeRoute />);

    for (const tierId of ["engineer", "conductor", "executive"]) {
      const card = screen.getByTestId(`contribute-tier-card-${tierId}`);
      // There must be no span with inline-flex/rounded box classes housing the icon
      const boxedIcon = card.querySelector("span.inline-flex.rounded-\\[0\\.7rem\\]");
      expect(boxedIcon).toBeNull();
    }
  });

  it("Conductor is the featured card", () => {
    render(<ContributeRoute />);

    const conductorCard = screen.getByTestId("contribute-tier-card-conductor");
    // Featured card gets md:-my-3 for vertical lift
    expect(conductorCard.className).toContain("md:-my-3");
  });

  it("non-featured cards do not have featured treatment", () => {
    render(<ContributeRoute />);

    const engineerCard = screen.getByTestId("contribute-tier-card-engineer");
    const executiveCard = screen.getByTestId("contribute-tier-card-executive");
    expect(engineerCard.className).not.toContain("md:-my-3");
    expect(executiveCard.className).not.toContain("md:-my-3");
  });

  it("does not render per-card purchase or action buttons", () => {
    render(<ContributeRoute />);

    for (const tierId of ["engineer", "conductor", "executive"]) {
      const card = screen.getByTestId(`contribute-tier-card-${tierId}`);
      expect(within(card).queryByRole("link")).toBeNull();
      expect(within(card).queryByRole("button")).toBeNull();
    }
  });

  // ── Metadata ──────────────────────────────────────────────────────────────

  it("metadata for /contribute resolves via the standardized page-metadata system", () => {
    const meta = resolvePageMetadata("/contribute");

    expect(meta.title).toBe("Contribute");
    expect(meta.suite.id).toBe("general");
    expect(meta.pageTitle).toBe("Contribute");
  });

  // ── Shared sources ────────────────────────────────────────────────────────

  it("uses the same TIER_STYLES source as credits — no duplicate definitions", async () => {
    const { TIER_STYLES: creditsStyles, getTierStyle } =
      await import("@/features/credits/lib/tier-styles");

    expect(getTierStyle("engineer")).toBe(creditsStyles.engineer);
    expect(getTierStyle("conductor")).toBe(creditsStyles.conductor);
    expect(getTierStyle("executive")).toBe(creditsStyles.executive);
  });
});
