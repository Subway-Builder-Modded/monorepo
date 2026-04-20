import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { SuiteRail } from "@/app/components/navigation/suite-rail";
import type { NavbarSuiteRailItem } from "@/app/components/navigation/navbar-model";

const SUITES: NavbarSuiteRailItem[] = [
  {
    id: "general",
    title: "General",
    icon: () => null,
    accentColor: "#111",
    mutedColor: "#222",
  },
  {
    id: "registry",
    title: "Registry",
    icon: () => null,
    accentColor: "#333",
    mutedColor: "#444",
  },
];

describe("SuiteRail", () => {
  it("supports suite switching by hover and click", () => {
    const onSelect = vi.fn();

    render(<SuiteRail items={SUITES} selectedId="general" onSelect={onSelect} />);

    const registry = screen.getByRole("button", { name: "Registry" });

    fireEvent.mouseEnter(registry);
    fireEvent.click(registry);

    expect(onSelect).toHaveBeenNthCalledWith(1, "registry");
    expect(onSelect).toHaveBeenNthCalledWith(2, "registry");
  });
});
