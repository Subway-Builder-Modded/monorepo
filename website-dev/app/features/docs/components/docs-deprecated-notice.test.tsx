import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { DocsDeprecatedNotice } from "@/app/features/docs/components/docs-deprecated-notice";

vi.mock("@/app/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("DocsDeprecatedNotice", () => {
  it("renders an outlined amber link to the latest version with the same slug when available", () => {
    render(
      <DocsDeprecatedNotice
        suiteId="railyard"
        version="v0.1"
        currentSlug="github-token"
      />,
    );

    const latestButton = screen.getByRole("link", { name: "View Latest Version" });

    expect(latestButton).toHaveAttribute(
      "href",
      "/railyard/docs/v0.2/github-token",
    );
    expect(latestButton.className).toContain("border");
    expect(latestButton.className).toMatch(/amber/);
    expect(latestButton.querySelector("svg")).toBeTruthy();
  });

  it("falls back to the latest version defaultDoc when the slug is unavailable", () => {
    render(
      <DocsDeprecatedNotice
        suiteId="railyard"
        version="v0.1"
        currentSlug="missing/page"
      />,
    );

    expect(screen.getByRole("link", { name: "View Latest Version" })).toHaveAttribute(
      "href",
      "/railyard/docs/v0.2/installing-railyard",
    );
  });
});
