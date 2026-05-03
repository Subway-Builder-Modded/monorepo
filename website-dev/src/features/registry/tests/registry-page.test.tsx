import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/router", () => ({
  useLocation: vi.fn(() => ({ pathname: "/registry", search: "", hash: "" })),
  navigate: vi.fn(),
  Link: vi.fn(({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )),
}));

vi.mock("@/features/registry/lib/load-registry-cache", () => ({
  loadRegistryItemsForType: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/config/site-navigation", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/config/site-navigation")>();
  return {
    ...original,
    getSuiteById: () => ({
      id: "registry",
      title: "Registry",
      href: "/registry",
      icon: () => null,
      colorSchemeId: "registry",
      accent: {
        light: "#9d4edd",
        dark: "#c77dff",
        textInvertedLight: "#f2f2f2",
        textInvertedDark: "#232323",
        mutedLight: "rgba(157,78,221,0.18)",
        mutedDark: "rgba(199,125,255,0.13)",
      },
    }),
  };
});

import { RegistryRoute } from "@/features/registry/page";

describe("RegistryRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the registry hero heading", async () => {
    await act(async () => {
      render(<RegistryRoute />);
    });

    expect(screen.getByRole("heading", { name: "Registry" })).toBeInTheDocument();
  });

  it("renders the hero search input", async () => {
    await act(async () => {
      render(<RegistryRoute />);
    });

    // Hero and browse section both render a search input
    const searchInputs = screen.getAllByRole("searchbox", { name: "Search registry" });
    expect(searchInputs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the type toggle", async () => {
    await act(async () => {
      render(<RegistryRoute />);
    });

    // Hero and browse section both render type toggle groups
    const typeGroups = screen.getAllByRole("group", { name: "Asset type" });
    expect(typeGroups.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("radio", { name: /Maps/ }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("radio", { name: /Mods/ }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders the browse section sort bar", async () => {
    await act(async () => {
      render(<RegistryRoute />);
    });

    expect(screen.getByText("Sort:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last Updated" })).toBeInTheDocument();
  });

  it("renders the view toggle", async () => {
    await act(async () => {
      render(<RegistryRoute />);
    });

    expect(screen.getByRole("group", { name: "View mode" })).toBeInTheDocument();
  });

  it("renders browse indicator with ChevronDown", async () => {
    await act(async () => {
      render(<RegistryRoute />);
    });

    expect(screen.getByRole("button", { name: /Browse Registry/i })).toBeInTheDocument();
  });

  it("renders with empty state when no items match", async () => {
    const { loadRegistryItemsForType } =
      await import("@/features/registry/lib/load-registry-cache");
    vi.mocked(loadRegistryItemsForType).mockResolvedValue([]);

    await act(async () => {
      render(<RegistryRoute />);
    });

    await waitFor(() => {
      expect(screen.getByText(/No items match your search/i)).toBeInTheDocument();
    });
  });

  it("does not render when pathname is not /registry", async () => {
    const { useLocation } = await import("@/lib/router");
    vi.mocked(useLocation).mockReturnValue({ pathname: "/railyard", search: "", hash: "" });

    await act(async () => {
      render(<RegistryRoute />);
    });

    expect(screen.queryByRole("heading", { name: "Registry" })).not.toBeInTheDocument();
  });
});
