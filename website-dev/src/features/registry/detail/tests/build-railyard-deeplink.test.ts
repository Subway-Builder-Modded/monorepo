import { describe, expect, it } from "vitest";
import { buildRailyardDeeplink } from "@/features/registry/detail/lib/build-railyard-deeplink";

describe("buildRailyardDeeplink", () => {
  it("encodes route segment and id", () => {
    expect(buildRailyardDeeplink("mods", "mod with spaces")).toBe(
      "railyard://open?type=mods&id=mod%20with%20spaces",
    );
  });
});
