import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UpdatePageLayout } from "@/features/updates/components/update-page-layout";

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
      },
    },
  ]),
  getUpdateSourcePath: vi.fn(() => "/content/railyard/updates/v0.2.0.mdx"),
  loadUpdateContent: vi.fn(async () => () => <div>Update body content</div>),
  getUpdateDirectoryEntries: vi.fn(() => []),
}));

describe("UpdatePageLayout", () => {
  it("renders update page content, parent actions, and hides empty release candidates section", async () => {
    render(<UpdatePageLayout suiteId="railyard" id="v0.2.0" />);

    expect(screen.getByRole("heading", { name: "Railyard v0.2.0" })).toBeInTheDocument();
    expect(screen.getByText("v0.2.0 • 2026-04-18")).toBeInTheDocument();
    expect(screen.getAllByText("Latest").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /View Analytics/i })).toHaveAttribute(
      "href",
      "/railyard/analytics/versions/v0.2.0",
    );
    expect(screen.getByRole("link", { name: /Download/i })).toHaveAttribute(
      "href",
      "https://example.com/download",
    );
    expect(screen.queryByText("Release Candidates")).not.toBeInTheDocument();

    expect(await screen.findByText("Update body content")).toBeInTheDocument();
  });
});
