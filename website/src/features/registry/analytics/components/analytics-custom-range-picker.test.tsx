import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsCustomRangePicker } from "./analytics-custom-range-picker";

function getDayButton(pattern: RegExp) {
  const matches = screen
    .getAllByRole("button")
    .filter((button) => pattern.test(button.getAttribute("aria-label") ?? ""));
  expect(matches.length).toBeGreaterThan(0);
  return matches[0];
}

describe("AnalyticsCustomRangePicker", () => {
  it("greys out ends that violate the sub-week floor rule", () => {
    const onApply = vi.fn();
    render(
      <AnalyticsCustomRangePicker
        range={{ from: "2026-06-01", to: "2026-06-14" }}
        onApply={onApply}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Change date range" });
    expect(trigger).toHaveTextContent("Jun 1, 2026 – Jun 14, 2026");
    fireEvent.click(trigger);
    expect(screen.getByText(/Pick a start date/)).toBeInTheDocument();

    // Start on 2026-06-20 — before the hourly floor, so a week-plus range is
    // forced: ends inside the same week disable, the 7th day stays enabled.
    fireEvent.click(getDayButton(/June 20/));
    expect(screen.getByText(/at least a week/)).toBeInTheDocument();
    expect(getDayButton(/June 23/)).toBeDisabled();
    expect(getDayButton(/June 25/)).toBeDisabled();
    expect(getDayButton(/June 26/)).not.toBeDisabled();

    // Completing with a valid week applies the range and closes.
    fireEvent.click(getDayButton(/June 26/));
    expect(onApply).toHaveBeenCalledWith({ from: "2026-06-20", to: "2026-06-26" });
  });

  it("keeps sub-week ranges available from the floor onward", () => {
    const onApply = vi.fn();
    render(
      <AnalyticsCustomRangePicker
        range={{ from: "2026-07-01", to: "2026-07-14" }}
        onApply={onApply}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change date range" }));
    fireEvent.click(getDayButton(/July 2/));
    expect(screen.getByText(/shorter than a week/)).toBeInTheDocument();
    // A three-day range starting at/after the floor is legal.
    expect(getDayButton(/July 4/)).not.toBeDisabled();
    fireEvent.click(getDayButton(/July 4/));
    expect(onApply).toHaveBeenCalledWith({ from: "2026-07-02", to: "2026-07-04" });
  });

  it("surfaces the validation error for an invalid applied range", () => {
    render(
      <AnalyticsCustomRangePicker
        range={{ from: "2026-06-30", to: "2026-07-02" }}
        onApply={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/hourly series/);
  });
});
