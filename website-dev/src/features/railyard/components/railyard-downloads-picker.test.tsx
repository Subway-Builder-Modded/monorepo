import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RailyardDownloadsPicker } from "@/features/railyard/components/railyard-downloads-picker";
import type { RailyardDownloadOption } from "@/features/railyard/railyard-types";

const options: RailyardDownloadOption[] = [
  {
    os: "windows",
    arch: "x64",
    label: "Windows (x64) Installer",
    assetName: "windows-x64-installer.exe",
  },
  {
    os: "windows",
    arch: "arm64",
    label: "Windows (ARM64) Installer",
    assetName: "windows-arm64-installer.exe",
  },
  {
    os: "macos",
    arch: "universal",
    label: "macOS Universal",
    assetName: "macos-universal.zip",
  },
];

describe("RailyardDownloadsPicker", () => {
  it("uses a unified OS -> architecture -> download flow", () => {
    render(<RailyardDownloadsPicker options={options} />);

    expect(screen.getByRole("button", { name: "Windows" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "macOS" })).toBeInTheDocument();

    expect(screen.getByText("Windows (x64) Installer")).toBeInTheDocument();
    expect(screen.getByText("Windows (ARM64) Installer")).toBeInTheDocument();
    expect(screen.queryByText("macOS Universal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "macOS" }));

    expect(screen.getByText("macOS Universal")).toBeInTheDocument();
    expect(screen.queryByText("Windows (x64) Installer")).not.toBeInTheDocument();
  });
});
