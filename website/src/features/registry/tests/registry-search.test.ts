import { describe, expect, it } from "vitest";
import { matchesRegistrySearch } from "@/features/registry/lib/registry-search";

describe("matchesRegistrySearch (Fuse extended search)", () => {
  const kronifer = ["Kronifer", "kronifer"];
  const rslurry = ["R Slurry", "rslurry"];
  const yamagata = ["Yukina-Yamagata", "yukina-yamagata", "ahkimn", "JP", "Japan"];
  const prague = ["Prague Metro", "cz-prague", "CZ", "Czechia"];

  it("matches all plain tokens as an implicit AND", () => {
    expect(matchesRegistrySearch(["Tokyo Metro", "jp-tokyo"], "tokyo metro")).toBe(true);
    expect(matchesRegistrySearch(["Tokyo Metro", "jp-tokyo"], "tokyo osaka")).toBe(false);
  });

  it("supports | as OR", () => {
    expect(matchesRegistrySearch(kronifer, "kronifer | slurry")).toBe(true);
    expect(matchesRegistrySearch(rslurry, "kronifer | slurry")).toBe(true);
    expect(matchesRegistrySearch(["martig7"], "kronifer | slurry")).toBe(false);
  });

  it("keeps AND semantics within OR groups", () => {
    expect(matchesRegistrySearch(["Tokyo Metro"], "tokyo metro | osaka")).toBe(true);
    expect(matchesRegistrySearch(["Osaka Loop"], "tokyo metro | osaka")).toBe(true);
    expect(matchesRegistrySearch(["Tokyo Tram"], "tokyo metro | osaka")).toBe(false);
  });

  it("supports ! as negation", () => {
    expect(matchesRegistrySearch(yamagata, "Yukina- !CZ")).toBe(true);
    expect(matchesRegistrySearch(prague, "Yukina- !CZ")).toBe(false);
    expect(matchesRegistrySearch(prague, "metro !JP")).toBe(true);
    expect(matchesRegistrySearch(yamagata, "!JP")).toBe(false);
  });

  it("supports prefix and exact anchors against the combined text", () => {
    expect(matchesRegistrySearch(yamagata, "^Yukina")).toBe(true);
    expect(matchesRegistrySearch(prague, "^Metro")).toBe(false);
  });

  it("matches diacritic- and case-insensitively", () => {
    expect(matchesRegistrySearch(["São Paulo"], "sao paulo")).toBe(true);
    expect(matchesRegistrySearch(["Kronifer"], "KRONIFER")).toBe(true);
  });

  it("ignores dangling operators while typing", () => {
    expect(matchesRegistrySearch(kronifer, "kronifer | ")).toBe(true);
    expect(matchesRegistrySearch(kronifer, "kronifer !")).toBe(true);
    expect(matchesRegistrySearch(kronifer, "| kronifer")).toBe(true);
    expect(matchesRegistrySearch(kronifer, "!")).toBe(true);
  });

  it("matches everything on an empty query", () => {
    expect(matchesRegistrySearch(kronifer, "")).toBe(true);
    expect(matchesRegistrySearch(kronifer, "   ")).toBe(true);
  });
});
