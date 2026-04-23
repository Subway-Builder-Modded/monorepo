import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpenSourceSection } from "@/features/home/components/open-source-section";
import { OPEN_SOURCE_SECTION } from "@/config/home";

describe("OpenSourceSection", () => {
  it("renders open-source content from unified homepage data", () => {
    render(<OpenSourceSection />);

    expect(screen.getByRole("heading", { name: OPEN_SOURCE_SECTION.title })).toBeVisible();
    expect(screen.getByText(OPEN_SOURCE_SECTION.description)).toBeVisible();
    expect(screen.getByText(OPEN_SOURCE_SECTION.body)).toBeVisible();
    expect(screen.getByRole("link", { name: OPEN_SOURCE_SECTION.cta.label })).toHaveAttribute(
      "href",
      OPEN_SOURCE_SECTION.cta.href,
    );
    expect(screen.getByText(OPEN_SOURCE_SECTION.codeSample.title)).toBeVisible();
  });
});
