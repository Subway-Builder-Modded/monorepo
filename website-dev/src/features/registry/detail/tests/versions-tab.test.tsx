import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VersionsTab } from "@/features/registry/detail/components/versions-tab";

describe("VersionsTab", () => {
  it("renders version/date/download rows", () => {
    render(
      <VersionsTab
        versions={[
          { version: "1.0.0", releaseDate: "2026-04-26T00:00:00.000Z", downloads: 102 },
          { version: "0.9.0", releaseDate: null, downloads: null },
        ]}
      />,
    );

    expect(screen.getAllByText("1.0.0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.9.0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Apr 26, 2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("\u2014").length).toBeGreaterThan(0);
    expect(screen.getAllByText("102").length).toBeGreaterThan(0);
  });
});
