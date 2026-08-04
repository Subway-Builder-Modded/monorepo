import { describe, expect, it } from "vitest";
import { bucketMultiSeriesData } from "@/shared/analytics/multi-series";

function makeDailyPoints(startDate: string, days: number) {
  const startMs = Date.parse(`${startDate}T00:00:00Z`);
  return Array.from({ length: days }, (_, index) => ({
    date: new Date(startMs + index * 86_400_000).toISOString().slice(0, 10),
    Downloads: 1,
  }));
}

describe("bucketMultiSeriesData", () => {
  it("passes data through untouched under the point cap", () => {
    const data = makeDailyPoints("2026-03-01", 10);

    expect(bucketMultiSeriesData(data)).toEqual({ data, grain: "daily" });
  });

  it("anchors weekly windows at the latest day so only the oldest bucket is partial", () => {
    const data = makeDailyPoints("2026-03-01", 10);

    const bucketed = bucketMultiSeriesData(data, { maxPoints: 5 });

    expect(bucketed.grain).toBe("weekly");
    expect(bucketed.data).toEqual([
      // Mar 1-3 fall into the older window (labeled by its start, Feb 25).
      { date: "2026-02-25", Downloads: 3 },
      // The newest bucket is always a complete trailing week: Mar 4-10.
      { date: "2026-03-04", Downloads: 7 },
    ]);
  });

  it("falls back to trailing 30-day windows when even weeks overflow", () => {
    const data = makeDailyPoints("2026-03-01", 10);

    const bucketed = bucketMultiSeriesData(data, { maxPoints: 1 });

    expect(bucketed.grain).toBe("monthly");
    expect(bucketed.data).toEqual([{ date: "2026-02-09", Downloads: 10 }]);
  });
});
