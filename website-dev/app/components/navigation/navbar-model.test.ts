import { describe, expect, it } from "vitest";
import { buildNavbarDisplayModel } from "@/app/components/navigation/navbar-model";

describe("buildNavbarDisplayModel", () => {
  it("keeps displayed suite bound to active route while closed", () => {
    const model = buildNavbarDisplayModel({
      pathname: "/registry/trending",
      openSuiteId: "railyard",
      phase: "closed",
      theme: "dark",
      isFrameExpanded: false,
    });

    expect(model.realSuite.id).toBe("registry");
    expect(model.displayedSuite.id).toBe("registry");
    expect(model.activeItem?.id).toBe("registry-trending");
  });

  it("uses selected open suite while expanded", () => {
    const model = buildNavbarDisplayModel({
      pathname: "/registry/trending",
      openSuiteId: "railyard",
      phase: "open",
      theme: "light",
      isFrameExpanded: true,
    });

    expect(model.realSuite.id).toBe("registry");
    expect(model.displayedSuite.id).toBe("railyard");
    expect(model.activeItem).toBeNull();
    expect(model.activeItemGlobal?.id).toBe("registry-trending");
  });

  it("builds full suite view models for rail and mobile groups", () => {
    const model = buildNavbarDisplayModel({
      pathname: "/",
      openSuiteId: "general",
      phase: "closed",
      theme: "light",
      isFrameExpanded: false,
    });

    expect(model.suiteRailItems.length).toBe(5);
    expect(model.allSuiteGroups.length).toBe(5);
    expect(model.allSuiteGroups.find((group) => group.id === "general")?.items.length).toBe(5);
    expect(model.breadcrumb).toBe("Home");
  });
});
