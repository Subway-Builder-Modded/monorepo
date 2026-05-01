import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UpdatePageLayout } from "@/features/updates/components/update-page-layout";
import * as updatesContent from "@/features/updates/lib/content";

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/updates/lib/content", () => ({
  findUpdateEntry: vi.fn(() => ({
    id: "v0.2.0",
    suiteId: "railyard",
    sourcePath: "/content/railyard/updates/v0.2.0.mdx",
    routePath: "/railyard/updates/v0.2.0",
    raw: "",
    loader: vi.fn(),
    frontmatter: {
      title: "Railyard v0.2.0",
      description: "Release notes",
      icon: "TrainTrack",
      date: "2026-04-18",
      tag: "release",
      url: "https://example.com/download",
      previousVersion: "v0.1.9",
      compareUrl: "https://github.com/example/repo/compare/v0.1.9...v0.2.0#files_bucket",
    },
  })),
  getUpdatesEntries: vi.fn(() => [
    {
      id: "v0.2.0",
      suiteId: "railyard",
      sourcePath: "/content/railyard/updates/v0.2.0.mdx",
      routePath: "/railyard/updates/v0.2.0",
      raw: "",
      loader: vi.fn(),
      frontmatter: {
        title: "Railyard v0.2.0",
        description: "Release notes",
        icon: "TrainTrack",
        date: "2026-04-18",
        tag: "release",
        url: "https://example.com/download",
        previousVersion: "v0.1.9",
        compareUrl: "https://github.com/example/repo/compare/v0.1.9...v0.2.0#files_bucket",
      },
    },
  ]),
  getUpdateSourcePath: vi.fn(() => "/content/railyard/updates/v0.2.0.mdx"),
  getUpdateRawContent: vi.fn(() => "---\ntitle: Railyard v0.2.0\n---\n\n# Notes\n"),
  getUpdateEditUrl: vi.fn(() => "https://example.com/edit/v0.2.0.mdx"),
  loadUpdateContent: vi.fn(async () => () => <div>Update body content</div>),
  getUpdateDirectoryEntries: vi.fn(() => []),
}));

describe("UpdatePageLayout", () => {
  it("renders update page content, parent actions, edit/copy controls, and compare footer CTA", async () => {
    render(<UpdatePageLayout suiteId="railyard" id="v0.2.0" />);

    expect(screen.getByRole("heading", { name: "Railyard v0.2.0" })).toBeInTheDocument();
    expect(screen.getByText("2026-04-18")).toBeInTheDocument();
    expect(screen.getAllByText("Latest").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /View Analytics/i })).toHaveAttribute(
      "href",
      "/railyard/analytics/versions/v0.2.0",
    );
    expect(screen.getByRole("link", { name: /Download/i })).toHaveAttribute(
      "href",
      "https://example.com/download",
    );
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "https://example.com/edit/v0.2.0.mdx",
    );
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Full Changelog/i })).toHaveAttribute(
      "href",
      "https://github.com/example/repo/compare/v0.1.9...v0.2.0#files_bucket",
    );
    expect(screen.queryByText("Release Candidates")).not.toBeInTheDocument();

    expect(await screen.findByText("Update body content")).toBeInTheDocument();
  });

  it("does not render compare CTA when compare metadata is absent", () => {
    vi.mocked(updatesContent.findUpdateEntry).mockReturnValueOnce({
      id: "v0.2.1",
      suiteId: "railyard",
      key: "v0.2.1",
      depth: 0,
      sourcePath: "/content/railyard/updates/v0.2.1.mdx",
      routePath: "/railyard/updates/v0.2.1",
      raw: "",
      loader: vi.fn(),
      frontmatter: {
        title: "Railyard v0.2.1",
        icon: "TrainTrack",
        date: "2026-04-19",
        tag: "release",
        url: "https://example.com/download",
      },
    });

    render(<UpdatePageLayout suiteId="railyard" id="v0.2.1" />);
    expect(screen.queryByRole("link", { name: /Full Changelog/i })).not.toBeInTheDocument();
  });

  it("formats release candidate compare label with ellipsis separator", () => {
    vi.mocked(updatesContent.findUpdateEntry).mockReturnValueOnce({
      id: "v0.2.4/rc.1",
      suiteId: "railyard",
      key: "v0.2.4/rc.1",
      depth: 1,
      sourcePath: "/content/railyard/updates/v0.2.4/rc.1.mdx",
      routePath: "/railyard/updates/v0.2.4/rc.1",
      raw: "",
      loader: vi.fn(),
      frontmatter: {
        title: "Railyard v0.2.4+rc.1",
        icon: "TrainTrack",
        date: "2026-04-30",
        tag: "release-candidate",
        previousVersion: "v0.2.3",
        compareUrl: "https://github.com/example/repo/compare/v0.2.3...v0.2.4+rc.1",
      },
    });

    render(<UpdatePageLayout suiteId="railyard" id="v0.2.4/rc.1" />);

    expect(screen.getByText("v0.2.3...v0.2.4+rc.1")).toBeInTheDocument();
  });
});
