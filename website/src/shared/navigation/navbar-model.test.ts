import { describe, expect, it } from "vitest";
import { buildNavbarDisplayModel } from "@/shared/navigation/navbar-model";

describe("buildNavbarDisplayModel", () => {
  it("builds full suite view models for rail and mobile groups", () => {
    const model = buildNavbarDisplayModel({
      pathname: "/",
      openSuiteId: "general",
      phase: "closed",
      theme: "light",
      isFrameExpanded: false,
    });

    expect(model.suiteRailItems.length).toBe(6);
    expect(model.allSuiteGroups.length).toBe(6);
    expect(model.allSuiteGroups.find((group) => group.id === "general")?.items.length).toBe(5);
  });
});
