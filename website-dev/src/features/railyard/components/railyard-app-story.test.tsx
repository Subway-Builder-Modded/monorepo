import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RailyardAppStory } from "@/features/railyard/components/railyard-app-story";

describe("RailyardAppStory", () => {
  it("updates the selected story content when a step is chosen", () => {
    render(<RailyardAppStory />);

    expect(screen.getByRole("button", { name: /Browse Registry/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: /Install Content/i }));

    expect(screen.getByRole("button", { name: /Install Content/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
