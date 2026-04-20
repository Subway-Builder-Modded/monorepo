import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { SuiteScrollytellingSection } from "@/app/features/home/components/suite-scrollytelling";
import {
  SUITE_SCROLLYTELLING_SECTION,
  SUITE_STEPS,
} from "@/app/config/home";

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
});
