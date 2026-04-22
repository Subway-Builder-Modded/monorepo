import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import { DocsVersionChooser } from "@/app/features/docs/components/docs-version-chooser";
import { getVisibleVersions } from "@/app/config/docs";
import { getVersionSwitchUrl } from "@/app/features/docs/lib/routing";

vi.mock("@/app/config/docs", async () => {
  const actual = await vi.importActual<typeof import("@/app/config/docs")>("@/app/config/docs");
  return {
    ...actual,
    getVisibleVersions: vi.fn(() => [
      { value: "v0.2", label: "v0.2", status: "latest" },
      { value: "v0.1", label: "v0.1", status: "deprecated" },
    ]),
  };
});

vi.mock("@/app/features/docs/lib/routing", async () => {
  const actual = await vi.importActual<typeof import("@/app/features/docs/lib/routing")>(
    "@/app/features/docs/lib/routing",
  );

  return {
    ...actual,
    getVersionSwitchUrl: vi.fn((suiteId: string, version: string, docSlug?: string | null) => {
      if (suiteId === "railyard" && version === "v0.2" && docSlug === "missing-doc") {
        return "/railyard/docs/v0.2/players";
      }
      return actual.getVersionSwitchUrl(suiteId as any, version, docSlug as any);
    }),
  };
});

describe("DocsVersionChooser", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("navigates to docs homepage when homepageMode is enabled", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    render(<DocsVersionChooser suiteId="railyard" currentVersion="v0.1" homepageMode />);

    await user.click(screen.getByRole("button", { name: "Choose documentation version" }));
    await user.click(screen.getByRole("option", { name: /v0.2/i }));

    expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/railyard/docs?version=v0.2");
  });

  it("navigates to the same doc slug when docSlug is provided", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    render(<DocsVersionChooser suiteId="railyard" currentVersion="v0.1" docSlug="github-token" />);

    await user.click(screen.getByRole("button", { name: "Choose documentation version" }));
    await user.click(screen.getByRole("option", { name: /v0.2/i }));

    expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/railyard/docs/v0.2/github-token");
  });

  it("navigates with doc-page fallback URL when same doc is unavailable in selected version", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    render(<DocsVersionChooser suiteId="railyard" currentVersion="v0.1" docSlug="missing-doc" />);

    await user.click(screen.getByRole("button", { name: "Choose documentation version" }));
    await user.click(screen.getByRole("option", { name: /v0.2/i }));

    expect(getVersionSwitchUrl).toHaveBeenCalledWith("railyard", "v0.2", "missing-doc");
    expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/railyard/docs/v0.2/players");
  });

  it("returns null for one-version suites (unversioned UI)", () => {
    vi.mocked(getVisibleVersions).mockReturnValueOnce([
      { value: "v0.2", label: "v0.2", status: "latest" },
    ] as any);

    const { container } = render(<DocsVersionChooser suiteId="railyard" currentVersion="v0.2" />);
    expect(container.firstChild).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Choose documentation version" }),
    ).not.toBeInTheDocument();
  });
});
