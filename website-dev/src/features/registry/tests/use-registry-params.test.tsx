import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRegistryParams } from "@/features/registry/lib/use-registry-params";

const mockNavigate = vi.fn();
const mockUseLocation = vi.fn(() => ({ pathname: "/registry", search: "", hash: "" }));

vi.mock("@/lib/router", () => ({
  navigate: (...args: unknown[]) => mockNavigate(...args),
  useLocation: () => mockUseLocation(),
}));

describe("useRegistryParams", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseLocation.mockReset();
    mockUseLocation.mockReturnValue({ pathname: "/registry", search: "", hash: "" });
  });

  it("parses defaults when URL search is empty", () => {
    const { result } = renderHook(() => useRegistryParams());

    expect(result.current.params).toMatchObject({
      typeId: "maps",
      query: "",
      tags: [],
      sortId: "lastUpdated",
      sortDir: "desc",
      viewMode: "compact",
    });
  });

  it("maps legacy view=grid to compact", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/registry",
      search: "?view=grid",
      hash: "",
    });

    const { result } = renderHook(() => useRegistryParams());

    expect(result.current.params.viewMode).toBe("compact");
  });

  it("parses valid params and trims tags", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/registry",
      search: "?type=maps&q=tokyo&tags=alpha,%20beta,,&sort=name&dir=asc&view=list",
      hash: "",
    });

    const { result } = renderHook(() => useRegistryParams());

    expect(result.current.params).toMatchObject({
      typeId: "maps",
      query: "tokyo",
      tags: ["alpha", "beta"],
      sortId: "name",
      sortDir: "asc",
      viewMode: "list",
    });
  });

  it("falls back to supported sort when sort is not valid for selected type", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/registry",
      search: "?type=mods&sort=population",
      hash: "",
    });

    const { result } = renderHook(() => useRegistryParams());

    expect(result.current.params.typeId).toBe("mods");
    expect(result.current.params.sortId).toBe("lastUpdated");
  });

  it("setParams serializes only non-default params", () => {
    const { result } = renderHook(() => useRegistryParams());

    act(() => {
      result.current.setParams({
        typeId: "mods",
        query: "signals",
        tags: ["metro", "asia"],
        sortId: "downloads",
        sortDir: "asc",
        viewMode: "list",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      "/registry?type=mods&q=signals&tags=metro%2Casia&sort=downloads&dir=asc&view=list",
      { preserveScroll: true },
    );
  });

  it("setParams resets sort when changing to a type that does not support current sort", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/registry",
      search: "?type=maps&sort=population",
      hash: "",
    });

    const { result } = renderHook(() => useRegistryParams());

    act(() => {
      result.current.setParams({ typeId: "mods" });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/registry?type=mods", {
      preserveScroll: true,
    });
  });
});
