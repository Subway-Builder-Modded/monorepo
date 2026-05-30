import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownPlaygroundRoute } from "@/features/markdown-playground/page";
import { STORAGE_KEYS } from "@/features/markdown-playground/lib/storage";

vi.mock("@/lib/router", () => ({
  useLocation: () => ({ pathname: "/registry/markdown-playground", search: "" }),
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
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
    render(<MarkdownPlaygroundRoute />);

    const input = screen.getByTestId("playground-markdown-input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "# Persisted value" } });

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEYS.content)).toContain("Persisted value");
    });
  }, 20000);

  it("toolbar action updates markdown content", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    const input = screen.getByTestId("playground-markdown-input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "hello" } });
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

    const markdownInput = screen.getByTestId("playground-markdown-input") as HTMLTextAreaElement;
    fireEvent.change(markdownInput, { target: { value: "# Header" } });

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
    expect(screen.queryByText("Map Description template")).not.toBeInTheDocument();
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

  it("renders inserted map description template through the direct rich preview", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    await user.click(screen.getByTestId("playground-use-template"));
    await user.click(await screen.findByTestId("template-card-map-description"));
    await user.click(screen.getByTestId("template-use-latest"));

    await user.click(screen.getByTestId("mode-rich"));

    const richInput = await screen.findByTestId("playground-rich-input");
    await waitFor(() => {
      expect(richInput.textContent).toContain("Coverage");
    });

    expect(richInput.innerHTML).toContain("text-4xl font-extrabold");
    expect(richInput.innerHTML).toContain("mdx-table-wrap");
    expect(richInput.innerHTML).toContain("group/summary");
    expect(richInput.textContent).toContain("Coverage");
  });

  it("shows verified indicator for verified template authors", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    await user.click(screen.getByTestId("playground-use-template"));
    const card = await screen.findByTestId("template-card-map-description");

    expect(card.querySelector(".lucide-badge-check")).toBeInTheDocument();
  });

  it("uses an unconstrained editor region with auto-growing markdown input", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    const region = screen.getByTestId("playground-content-region");
    const markdownInput = screen.getByTestId("playground-markdown-input");

    expect(region.className).not.toContain("overflow-y-auto");
    expect(region.className).not.toContain("h-[70vh]");
    expect(region.className).not.toContain("max-h-[70vh]");
    expect(markdownInput.className).toContain("overflow-hidden");
    expect(markdownInput.className).not.toContain("overflow-y-auto");

    await user.click(screen.getByTestId("mode-rich"));
    const richInput = await screen.findByTestId("playground-rich-input");
    expect(richInput.className).not.toContain("h-full");
    expect(richInput.className).not.toContain("overflow-y-auto");
  });
});
