import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { HomePage } from "@/app/features/home/home-page";
import {
  ANALYTICS_SECTION,
  HERO_TITLE_LINE_1,
  HERO_TITLE_LINE_2,
  OPEN_SOURCE_SECTION,
  PEOPLE_SECTION,
  SUITE_SCROLLYTELLING_SECTION,
} from "@/app/config/home";

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
