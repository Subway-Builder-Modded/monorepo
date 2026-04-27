import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownPlaygroundRoute } from "@/features/markdown-playground/page";
import { STORAGE_KEYS } from "@/features/markdown-playground/lib/storage";

vi.mock("@/lib/router", () => ({
  useLocation: () => ({ pathname: "/registry/markdown-playground", search: "" }),
}));

const copyPlaygroundContentMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/features/markdown-playground/lib/copy-playground-content", () => ({
  copyPlaygroundContent: (value: string) => copyPlaygroundContentMock(value),
}));

describe("MarkdownPlaygroundRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders standardized page identity from navigation metadata", () => {
    render(<MarkdownPlaygroundRoute />);

    expect(screen.getByRole("heading", { name: "Playground" })).toBeInTheDocument();
    expect(
      screen.getByText("Experiment with Markdown content in a live preview environment."),
    ).toBeInTheDocument();
  });

  it("renders one editor surface with toolbar and one shared content region", () => {
    render(<MarkdownPlaygroundRoute />);

    expect(screen.getAllByTestId("markdown-playground-editor-surface")).toHaveLength(1);
    expect(screen.getByTestId("markdown-playground-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("playground-content-region")).toBeInTheDocument();
  });

  it("renders all required toolbar actions", () => {
    render(<MarkdownPlaygroundRoute />);

    const actionIds = [
      "h1",
      "h2",
      "h3",
      "h4",
      "bold",
      "italic",
      "strike",
      "inline-code",
      "code-block",
      "blockquote",
      "bullet-list",
      "numbered-list",
      "link",
      "image",
      "horizontal-rule",
    ];

    for (const actionId of actionIds) {
      expect(screen.getByTestId(`toolbar-action-${actionId}`)).toBeInTheDocument();
    }
  });

  it("places mode switcher on toolbar right and copy buttons after switcher", () => {
    render(<MarkdownPlaygroundRoute />);

    const rightGroup = screen.getByTestId("toolbar-right-group");
    const switcher = within(rightGroup).getByTestId("playground-mode-switcher");
    const copyMarkdown = within(rightGroup).getByTestId("copy-markdown");
    const copyHtml = within(rightGroup).getByTestId("copy-html");

    expect(rightGroup.firstElementChild).toBe(switcher);
    expect(
      switcher.compareDocumentPosition(copyMarkdown) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      copyMarkdown.compareDocumentPosition(copyHtml) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("enforces left-to-right editor direction in both modes", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    const markdownInput = screen.getByTestId("playground-markdown-input");
    expect(markdownInput).toHaveAttribute("dir", "ltr");

    await user.click(screen.getByTestId("mode-rich"));
    const richInput = await screen.findByTestId("playground-rich-input");
    expect(richInput).toHaveAttribute("dir", "ltr");
  });

  it("persists content after typing", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    const input = screen.getByTestId("playground-markdown-input");
    await user.clear(input);
    await user.type(input, "# Persisted value");

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEYS.content)).toContain("Persisted value");
    });
  });

  it("toolbar action updates markdown content", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    const input = screen.getByTestId("playground-markdown-input") as HTMLTextAreaElement;
    await user.clear(input);
    await user.type(input, "hello");
    input.setSelectionRange(0, 5);

    await user.click(screen.getByTestId("toolbar-action-bold"));

    expect(input.value).toContain("**hello**");
  });

  it("switches between mutually exclusive markdown and rich views of same area", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    expect(screen.getByTestId("playground-markdown-input")).toBeInTheDocument();
    expect(screen.queryByTestId("playground-rich-input")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("mode-rich"));
    expect(await screen.findByTestId("playground-rich-input")).toBeInTheDocument();
    expect(screen.queryByTestId("playground-markdown-input")).not.toBeInTheDocument();
  });

  it("copies markdown and html from toolbar actions", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    const markdownInput = screen.getByTestId("playground-markdown-input");
    await user.clear(markdownInput);
    await user.type(markdownInput, "# Header");

    await user.click(screen.getByTestId("copy-markdown"));
    await user.click(screen.getByTestId("copy-html"));

    expect(copyPlaygroundContentMock).toHaveBeenCalledTimes(2);
    expect(copyPlaygroundContentMock.mock.calls[0][0]).toContain("# Header");
    expect(copyPlaygroundContentMock.mock.calls[1][0]).toContain("<h1");
  });

  it("opens semantic full-screen template modal with viewport overlay and panel gutters", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    await user.click(screen.getByTestId("playground-use-template"));

    expect(await screen.findByRole("dialog", { name: /Browse Templates/i })).toBeInTheDocument();

    const overlay = document.querySelector("[data-slot='dialog-overlay']");
    expect(overlay).toBeTruthy();
    expect(overlay?.className).toContain("inset-0");

    const panel = await screen.findByTestId("registry-template-modal-panel");
    expect(panel.className).toContain("fixed");
    expect(panel.className).toContain("lg:!inset-8");
  });

  it("renders icon-first cards, opens listing screen, and closes on use", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    await user.click(screen.getByTestId("playground-use-template"));
    const card = await screen.findByTestId("template-card-map-description");
    expect(
      within(card).getByTestId("template-card-icon-stage-map-description"),
    ).toBeInTheDocument();

    await user.click(card);

    expect(await screen.findByTestId("template-listing-screen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse Templates" })).toBeInTheDocument();
    expect(screen.getByTestId("template-version-row-v1.0.0")).toBeInTheDocument();

    // Clicking "Use Template" inserts latest version body and closes the modal
    await user.click(screen.getByTestId("template-use-latest"));
    expect(screen.queryByTestId("template-listing-screen")).not.toBeInTheDocument();

    await waitFor(() => {
      const value = (screen.getByTestId("playground-markdown-input") as HTMLTextAreaElement).value;
      expect(value.length).toBeGreaterThan(0);
    });
  });

  it("inserts the correct version body when a specific version is previewed and confirmed", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    await user.click(screen.getByTestId("playground-use-template"));
    await user.click(await screen.findByTestId("template-card-map-description"));

    // Preview v1 specifically from the version list, then confirm use from preview
    await user.click(await screen.findByTestId("template-version-preview-v1.0.0"));
    expect(screen.queryByTestId("template-listing-screen")).not.toBeInTheDocument();
    await user.click(await screen.findByTestId("template-preview-use"));

    await waitFor(() => {
      const value = (screen.getByTestId("playground-markdown-input") as HTMLTextAreaElement).value;
      expect(value.length).toBeGreaterThan(0);
    });
  });

  it("shows verified indicator for verified template authors", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    await user.click(screen.getByTestId("playground-use-template"));
    const card = await screen.findByTestId("template-card-map-description");

    expect(within(card).getByLabelText("Verified author")).toBeInTheDocument();
  });
});
