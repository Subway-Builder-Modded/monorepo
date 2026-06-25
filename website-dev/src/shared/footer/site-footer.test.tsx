import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SITE_SUITES } from "@/config/site-navigation";
import { SiteFooter } from "@/shared/footer/site-footer";

describe("SiteFooter", () => {
  it("renders the brand, community links, and suite columns", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: /subway builder modded/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /discord/i })).toHaveAttribute(
      "href",
      "https://discord.gg/syG9YHMyeG",
    );
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/Subway-Builder-Modded",
    );

    for (const suite of SITE_SUITES) {
      expect(screen.getByRole("heading", { name: suite.title })).toBeInTheDocument();
    }
  });
});
