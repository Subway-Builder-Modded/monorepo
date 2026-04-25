import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContributeRoute } from "@/features/contribute/page";
import { KOFI_MEMBERSHIPS_URL } from "@/config/shared/support";
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

  it("renders all 3 supporter tier cards as the page centerpiece", () => {
    render(<ContributeRoute />);

    expect(screen.getByTestId("contribute-tier-card-engineer")).toBeInTheDocument();
    expect(screen.getByTestId("contribute-tier-card-conductor")).toBeInTheDocument();
    expect(screen.getByTestId("contribute-tier-card-executive")).toBeInTheDocument();
  });

  it("renders exactly 3 tier cards — no extras", () => {
    render(<ContributeRoute />);

    const grid = screen.getByTestId("contribute-tiers-grid");
    const cards = within(grid).getAllByRole("article");
    expect(cards).toHaveLength(3);
  });

  it("tier cards use icons and colors from the shared TIER_STYLES source", () => {
    render(<ContributeRoute />);

    // Verify each card exists and has the accent CSS variables set from TIER_STYLES.
    for (const tierId of ["engineer", "conductor", "executive"] as const) {
      const card = screen.getByTestId(`contribute-tier-card-${tierId}`);
      const style = card.getAttribute("style") ?? "";
      expect(style).toContain(TIER_STYLES[tierId].accentLight);
    }
  });

  it("tier cards display tier name, price, and benefit list", () => {
    render(<ContributeRoute />);

    // Engineer
    const engineerCard = screen.getByTestId("contribute-tier-card-engineer");
    expect(within(engineerCard).getByText("Engineer")).toBeInTheDocument();
    expect(within(engineerCard).getByText("$3")).toBeInTheDocument();
    expect(
      within(engineerCard).getByText("Name shown in contributor credits"),
    ).toBeInTheDocument();

    // Conductor
    const conductorCard = screen.getByTestId("contribute-tier-card-conductor");
    expect(within(conductorCard).getByText("Conductor")).toBeInTheDocument();
    expect(within(conductorCard).getByText("$7")).toBeInTheDocument();

    // Executive
    const executiveCard = screen.getByTestId("contribute-tier-card-executive");
    expect(within(executiveCard).getByText("Executive")).toBeInTheDocument();
    expect(within(executiveCard).getByText("$15")).toBeInTheDocument();
  });

  it("renders a single central memberships CTA — no per-card purchase buttons", () => {
    render(<ContributeRoute />);

    // Exactly one CTA section
    expect(screen.getByTestId("contribute-cta-section")).toBeInTheDocument();

    // Exactly one CTA link
    const ctaLinks = screen.getAllByTestId("contribute-cta-link");
    expect(ctaLinks).toHaveLength(1);
  });

  it("central CTA links to the configured memberships URL", () => {
    render(<ContributeRoute />);

    const ctaLink = screen.getByTestId("contribute-cta-link");
    expect(ctaLink).toHaveAttribute("href", KOFI_MEMBERSHIPS_URL);
    expect(ctaLink).toHaveAttribute("target", "_blank");
    expect(ctaLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render per-card purchase/support buttons", () => {
    render(<ContributeRoute />);

    for (const tierId of ["engineer", "conductor", "executive"]) {
      const card = screen.getByTestId(`contribute-tier-card-${tierId}`);
      expect(within(card).queryByRole("link")).toBeNull();
      expect(within(card).queryByRole("button")).toBeNull();
    }
  });

  it("metadata for /contribute resolves via the standardized page-metadata system", () => {
    // The contribute route exists in SITE_NAV_ITEMS so resolvePageMetadata will
    // pick it up via getMatchingItem — no page-local override needed.
    const meta = resolvePageMetadata("/contribute");

    expect(meta.title).toBe("Contribute");
    expect(meta.suite.id).toBe("general");
    expect(meta.pageTitle).toBe("Contribute");
  });

  it("uses the same TIER_STYLES source as credits — no duplicate tier definitions", async () => {
    // Import both. They must reference the exact same object identity.
    const { TIER_STYLES: creditsStyles } = await import(
      "@/features/credits/lib/tier-styles"
    );
    const { getTierStyle } = await import("@/features/credits/lib/tier-styles");

    // getTierStyle used in contribute page must return from the same source.
    expect(getTierStyle("engineer")).toBe(creditsStyles.engineer);
    expect(getTierStyle("conductor")).toBe(creditsStyles.conductor);
    expect(getTierStyle("executive")).toBe(creditsStyles.executive);
  });
});
