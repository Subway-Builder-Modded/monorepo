import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RailyardAppStory } from "@/features/railyard/components/railyard-app-story";

describe("RailyardAppStory", () => {
  it("updates the selected story content when a step is chosen", () => {
    render(<RailyardAppStory />);

    expect(screen.getAllByAltText("Browsing maps and mods in Railyard").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Install Content/i }));

    expect(
      screen.getAllByAltText("Viewing a registry listing in Railyard before download").length,
    ).toBeGreaterThan(0);
  });
});
