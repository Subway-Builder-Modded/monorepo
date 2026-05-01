import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RailyardRoute } from "@/features/railyard/page";

vi.mock("@/lib/router", () => ({
  useLocation: () => ({ pathname: "/railyard", search: "" }),
  Link: vi.fn(({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )),
}));

vi.mock("@/features/railyard/railyard-registry-summary", () => ({
  fetchRailyardRegistrySummary: () => Promise.resolve({ mapsCount: 120, modsCount: 18 }),
}));

describe("RailyardRoute", () => {
  it("renders a complete railyard homepage layout", async () => {
    render(<RailyardRoute />);

    expect(screen.getByRole("heading", { name: "Railyard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Downloads" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Documentation" }).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /120 Maps/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /18 Mods/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Browse Registry" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Player Documentation" })).toBeInTheDocument();
    const worldMapLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.includes("/registry/world-map"));
    expect(worldMapLinks.length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Windows" }).length).toBeGreaterThan(0);
  });
});
