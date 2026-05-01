import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { COMMUNITY_DISCORD_LINK } from "@/config/community";
import { NotFoundPage } from "@/features/not-found/page";

vi.mock("@/lib/router", () => ({
  Link: vi.fn(({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )),
}));

describe("NotFoundPage", () => {
  it("renders only the transit badge plus home and discord actions", () => {
    render(<NotFoundPage />);

    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getAllByText("Not Found").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Discord" })).toHaveAttribute(
      "href",
      COMMUNITY_DISCORD_LINK,
    );
    expect(screen.queryByText("404 / Route Unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("This stop is not in service.")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Browse docs" })).not.toBeInTheDocument();
  });
});
