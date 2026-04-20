import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { AnalyticsSection } from "@/app/features/home/components/analytics-section";
import { ANALYTICS_LINKS, ANALYTICS_PREVIEW, ANALYTICS_SECTION } from "@/app/config/home";

describe("AnalyticsSection", () => {
  it("renders analytics content and all suite analytics links", () => {
    render(<AnalyticsSection />);

    expect(screen.getByRole("heading", { name: ANALYTICS_SECTION.title })).toBeVisible();
    expect(screen.getByText(ANALYTICS_SECTION.description)).toBeVisible();
    expect(screen.getByText(ANALYTICS_PREVIEW.title)).toBeVisible();

    for (const link of ANALYTICS_LINKS) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });
});
