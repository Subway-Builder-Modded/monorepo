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
    expect(switcher.compareDocumentPosition(copyMarkdown) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(copyMarkdown.compareDocumentPosition(copyHtml) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

  it("opens full-screen template modal and confirms replacement flow", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    const markdownInput = screen.getByTestId("playground-markdown-input");
    await user.clear(markdownInput);
    await user.type(markdownInput, "draft text");

    await user.click(screen.getByTestId("playground-use-template"));

    const galleryTitle = await screen.findByRole("heading", { name: "Use Template" });
    expect(galleryTitle).toBeInTheDocument();

    const fullscreenDialog = galleryTitle.closest("div[data-slot='dialog-content']");
    expect(fullscreenDialog?.className).toContain("inset-0");
    expect(fullscreenDialog?.className).toContain("h-dvh");

    await user.click(screen.getByTestId("template-card-release-notes"));
    expect(screen.getByText("Replace Current Draft")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect((screen.getByTestId("playground-markdown-input") as HTMLTextAreaElement).value).toContain(
      "draft text",
    );

    await user.click(screen.getByTestId("template-card-release-notes"));
    await user.click(screen.getByRole("button", { name: "Use Template" }));

    await waitFor(() => {
      const value = (screen.getByTestId("playground-markdown-input") as HTMLTextAreaElement).value;
      expect(value).toContain("Release Notes: vX.Y.Z");
      expect(localStorage.getItem(STORAGE_KEYS.content)).toContain("Release Notes: vX.Y.Z");
    });
  });

  it("shows verified indicator for verified template authors", async () => {
    const user = userEvent.setup();
    render(<MarkdownPlaygroundRoute />);

    await user.click(screen.getByTestId("playground-use-template"));
    const card = await screen.findByTestId("template-card-release-notes");

    expect(within(card).getByLabelText("Verified author")).toBeInTheDocument();
  });
});
