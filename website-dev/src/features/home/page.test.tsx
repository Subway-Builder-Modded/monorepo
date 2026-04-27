import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/features/home/page";
import {
  ANALYTICS_SECTION,
  HERO_TITLE_LINE_1,
  HERO_TITLE_LINE_2,
  OPEN_SOURCE_SECTION,
  PEOPLE_SECTION,
  SUITE_SCROLLYTELLING_SECTION,
} from "@/config/home";

vi.mock("@/features/home/components/hero-carousel", () => ({
  HeroCarousel: () => (
    <h1>
      {HERO_TITLE_LINE_1} {HERO_TITLE_LINE_2}
    </h1>
  ),
}));
vi.mock("@/features/home/components/hub-sections", () => ({
  PeopleSection: () => <h2>{PEOPLE_SECTION.title}</h2>,
}));
vi.mock("@/features/home/components/open-source-section", () => ({
  OpenSourceSection: () => <h2>{OPEN_SOURCE_SECTION.title}</h2>,
}));
vi.mock("@/features/home/components/analytics-section", () => ({
  AnalyticsSection: () => <h2>{ANALYTICS_SECTION.title}</h2>,
}));
vi.mock("@/features/home/components/suite-scrollytelling", () => ({
  SuiteScrollytellingSection: () => <h2>{SUITE_SCROLLYTELLING_SECTION.title}</h2>,
}));

describe("HomePage", () => {
  it("renders the full homepage composition", () => {
    const { container } = render(<HomePage />);

    const shellOptOut = container.firstElementChild as HTMLElement | null;
    expect(shellOptOut?.className).toContain("-mx-5");

    expect(
      screen.getByRole("heading", { name: `${HERO_TITLE_LINE_1} ${HERO_TITLE_LINE_2}` }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: PEOPLE_SECTION.title })).toBeVisible();
    expect(screen.getByRole("heading", { name: OPEN_SOURCE_SECTION.title })).toBeVisible();
    expect(screen.getByRole("heading", { name: ANALYTICS_SECTION.title })).toBeVisible();
    expect(screen.getByRole("heading", { name: SUITE_SCROLLYTELLING_SECTION.title })).toBeVisible();
  });
});
