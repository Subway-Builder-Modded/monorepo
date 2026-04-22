import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { SuiteScrollytellingSection } from "@/app/features/home/components/suite-scrollytelling";
import { SUITE_SCROLLYTELLING_SECTION, SUITE_STEPS } from "@/app/config/home";

describe("SuiteScrollytellingSection", () => {
  it("renders section copy and all suite story steps", () => {
    render(<SuiteScrollytellingSection />);

    expect(screen.getByRole("heading", { name: SUITE_SCROLLYTELLING_SECTION.title })).toBeVisible();
    expect(screen.getByText(SUITE_SCROLLYTELLING_SECTION.description)).toBeVisible();

    for (const step of SUITE_STEPS) {
      expect(screen.getByRole("heading", { name: step.title })).toBeVisible();
      expect(screen.getByText(step.description)).toBeVisible();

      const actionLinks = screen.getAllByRole("link", { name: step.primaryAction.label });
      expect(
        actionLinks.some((link) => link.getAttribute("href") === step.primaryAction.href),
      ).toBe(true);
    }
  });

  it("produces no bottom section spacing that would create a strip above the footer", () => {
    const { container } = render(<SuiteScrollytellingSection />);
    const section = container.querySelector("section")!;
    // The scrollytelling section uses noBottomSpacing — it is the last section
    // before the footer whose border-t acts as the sole visual separator.
    // No pb-* from SITE_SECTION_SPACING_CLASS should appear on the section.
    expect(section.className).not.toContain("pb-16");
    expect(section.className).not.toContain("pb-24");
    expect(section.className).not.toContain("pb-28");
    // No bottom border that would double with the footer's border-t.
    // Use word-boundary regex to avoid false-matching 'border-border/40'.
    expect(section.className).not.toMatch(/\bborder-b\b/);
    // Top border must still be present to separate from the section above.
    expect(section.className).toContain("border-t");
  });
});
