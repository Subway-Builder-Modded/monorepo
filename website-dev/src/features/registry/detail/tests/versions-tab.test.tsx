import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VersionsTab } from "@/features/registry/detail/components/versions-tab";

describe("VersionsTab", () => {
  it("renders version/date/download rows with icon-only action", () => {
    render(
      <VersionsTab
        routeSegment="maps"
        listingId="gwangju-4"
        versions={[
          {
            version: "1.0.0",
            releaseDate: "2026-04-26T00:00:00.000Z",
            downloads: 102,
            downloadUrl: "https://downloads.example/gwangju-1.0.0.zip",
            sourceRepo: "example/gwangju",
            sourceTag: "v1.0.0",
          },
          {
            version: "0.9.0",
            releaseDate: null,
            downloads: null,
            downloadUrl: null,
            sourceRepo: "example/gwangju",
            sourceTag: "v0.9.0",
          },
        ]}
      />,
    );

    expect(screen.getAllByText("1.0.0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.9.0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Apr 26, 2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("\u2014").length).toBeGreaterThan(0);
    expect(screen.getAllByText("102").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "1.0.0" })).toHaveAttribute(
      "href",
      "/registry/maps/gwangju-4/versions/1.0.0",
    );
    expect(screen.getByRole("link", { name: "0.9.0" })).toHaveAttribute(
      "href",
      "/registry/maps/gwangju-4/versions/0.9.0",
    );
    expect(screen.getByRole("link", { name: "" })).toHaveAttribute(
      "href",
      "https://downloads.example/gwangju-1.0.0.zip",
    );
  });

  it("sorts by clicked category and toggles direction", () => {
    render(
      <VersionsTab
        routeSegment="maps"
        listingId="gwangju-4"
        versions={[
          {
            version: "1.0.0",
            releaseDate: "2026-04-26T00:00:00.000Z",
            downloads: 102,
            downloadUrl: "https://downloads.example/gwangju-1.0.0.zip",
            sourceRepo: "example/gwangju",
            sourceTag: "v1.0.0",
          },
          {
            version: "0.9.0",
            releaseDate: "2026-04-20T00:00:00.000Z",
            downloads: 25,
            downloadUrl: "https://downloads.example/gwangju-0.9.0.zip",
            sourceRepo: "example/gwangju",
            sourceTag: "v0.9.0",
          },
          {
            version: "1.2.0",
            releaseDate: "2026-04-28T00:00:00.000Z",
            downloads: 50,
            downloadUrl: "https://downloads.example/gwangju-1.2.0.zip",
            sourceRepo: "example/gwangju",
            sourceTag: "v1.2.0",
          },
        ]}
      />,
    );

    const versionButtons = screen.getAllByRole("button", { name: /Version/i });
    const versionSortButton = versionButtons[0];
    expect(versionSortButton).toBeInTheDocument();
    const downloadsSortButton = screen.getByRole("button", { name: /Downloads/i });

    const getFirstVersionCell = () => {
      const bodyRows = screen.getAllByRole("row").slice(1);
      return bodyRows[0]?.querySelector("td")?.textContent;
    };

    expect(getFirstVersionCell()).toBe("1.2.0");

    fireEvent.click(versionSortButton!);
    expect(getFirstVersionCell()).toBe("0.9.0");

    fireEvent.click(versionSortButton!);
    expect(getFirstVersionCell()).toBe("1.2.0");

    fireEvent.click(downloadsSortButton);
    expect(getFirstVersionCell()).toBe("1.0.0");

    fireEvent.click(versionSortButton!);
    expect(getFirstVersionCell()).toBe("1.2.0");
  });
});
