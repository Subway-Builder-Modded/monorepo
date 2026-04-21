import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import { DocsVersionChooser } from "@/app/features/docs/components/docs-version-chooser";

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

describe("DocsVersionChooser", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("navigates to suite homepage version using shared chooser behavior", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    render(<DocsVersionChooser suiteId="railyard" currentVersion="v0.1" />);

    await user.click(screen.getByRole("button", { name: "Choose documentation version" }));
    await user.click(screen.getByRole("option", { name: /v0.2/i }));

    expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/railyard/docs/v0.2/players");
  });

  it("navigates to the same doc slug when docSlug is provided", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    render(
      <DocsVersionChooser
        suiteId="railyard"
        currentVersion="v0.1"
        docSlug="players/github-token"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Choose documentation version" }));
    await user.click(screen.getByRole("option", { name: /v0.2/i }));

    expect(pushStateSpy).toHaveBeenCalledWith(
      {},
      "",
      "/railyard/docs/v0.2/players/github-token",
    );
  });
});
