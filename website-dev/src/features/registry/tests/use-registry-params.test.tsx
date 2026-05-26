import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRegistryParams } from "@/features/registry/lib/use-registry-params";

const mockNavigate = vi.fn();
const mockUseLocation = vi.fn(() => ({ pathname: "/registry/maps", search: "", hash: "" }));

vi.mock("@/lib/router", () => ({
  navigate: (...args: unknown[]) => mockNavigate(...args),
  useLocation: () => mockUseLocation(),
}));

describe("useRegistryParams", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseLocation.mockReset();
    mockUseLocation.mockReturnValue({ pathname: "/registry/maps", search: "", hash: "" });
  });

  it("parses defaults when URL search is empty", () => {
    const { result } = renderHook(() => useRegistryParams());

    expect(result.current.params).toMatchObject({
      typeId: "maps",
      query: "",
      tags: [],
      sortId: "lastUpdated",
      sortDir: "desc",
      viewMode: "full",
    });
  });

  it("uses type from the pathname and non-type fields from the query string", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/registry/mods",
      search: "?q=tokyo&tags=alpha,beta&sort=name&dir=asc&view=list",
      hash: "",
    });

    const { result } = renderHook(() => useRegistryParams());

    expect(result.current.params).toMatchObject({
      typeId: "mods",
      query: "tokyo",
      tags: ["alpha", "beta"],
      sortId: "name",
      sortDir: "asc",
      viewMode: "list",
    });
  });

  it("parses query params from the URL", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/registry/maps",
      search: "?q=tokyo&tags=alpha,%20beta,,&sort=name&dir=asc&view=list",
      hash: "",
    });

    const { result } = renderHook(() => useRegistryParams());

    expect(result.current.params).toMatchObject({
      query: "tokyo",
      tags: ["alpha", "beta"],
      sortId: "name",
      sortDir: "asc",
      viewMode: "list",
    });
  });

  it("falls back to supported sort when cached sort is not valid for selected type", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/registry/mods",
      search: "?sort=population&dir=desc&view=full",
      hash: "",
    });

    const { result } = renderHook(() => useRegistryParams());

    expect(result.current.params.typeId).toBe("mods");
    expect(result.current.params.sortId).toBe("lastUpdated");
  });

  it("setParams updates the URL with query and sort state", () => {
    const { result } = renderHook(() => useRegistryParams());

    act(() => {
      result.current.setParams({
        query: "signals",
        tags: ["metro", "asia"],
        sortId: "downloads",
        sortDir: "asc",
        viewMode: "list",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/registry/maps?q=signals&tags=metro%2Casia&sort=downloads&dir=asc&view=list", {
      preserveScroll: true,
    });
  });

  it("setParams type change navigates to the typed registry path and preserves URL state", () => {
    const { result } = renderHook(() => useRegistryParams());

    act(() => {
      result.current.setParams({ typeId: "mods" });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/registry/mods", {
      preserveScroll: true,
    });
  });

  it("setParams normalizes unsupported sorts for a new type", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/registry/maps",
      search: "?q=tokyo&tags=alpha&sort=population&dir=asc&view=full",
      hash: "",
    });

    const { result } = renderHook(() => useRegistryParams());

    act(() => {
      result.current.setParams({ typeId: "mods" });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/registry/mods?q=tokyo&tags=alpha&dir=asc", {
      preserveScroll: true,
    });
  });
});
