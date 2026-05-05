import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegistryTemplate } from "@/lib/registry/templates";
import { TemplateGalleryModal } from "./template-gallery-modal";

vi.mock("@/features/markdown-playground/lib/mdx-runtime", () => ({
  renderPlaygroundHtml: vi.fn(async () => ({ html: "<p>Template listing description.</p>" })),
}));

const TEMPLATE_FIXTURE: RegistryTemplate = {
  slug: "demo-template",
  title: "Demo Template",
  description: "Template fixture for modal tests.",
  descriptionBody: "# Demo listing body",
  author: "Subway Builder Modded",
  icon: "MapPin",
  verified: true,
  latestVersion: "v2.0.0",
  latestDatePublished: "April 26, 2026",
  versions: [
    {
      id: "demo-template:v1.0.0",
      slug: "demo-template",
      version: "v1.0.0",
      datePublished: "April 25, 2026",
      body: "\n\n# Version 1 body\n\nOlder content.\n\n",
    },
    {
      id: "demo-template:v2.0.0",
      slug: "demo-template",
      version: "v2.0.0",
      datePublished: "April 26, 2026",
      body: "\n\n# Version 2 body\n\nLatest content.\n\n",
    },
  ],
};

describe("TemplateGalleryModal", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("opens latest preview screen from Preview Template and omits listing heading card", async () => {
    const onInsertTemplate = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TemplateGalleryModal
        open={true}
        onOpenChange={onOpenChange}
        templates={[TEMPLATE_FIXTURE]}
        onInsertTemplate={onInsertTemplate}
      />,
    );

    fireEvent.click(await screen.findByTestId("template-card-demo-template"));
    await waitFor(() => {
      expect(screen.getByTestId("template-preview-latest")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("template-preview-latest"));

    expect(await screen.findByTestId("template-preview-screen")).toBeInTheDocument();
    expect(screen.getAllByText("Preview").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("heading", { level: 2, name: "Demo Template" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("# Version 2 body", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(/^\s*# Version 2 body/)).not.toBeNull();
  }, 30_000);

  it("routes Preview on a previous version to Preview (version), then inserts on preview confirm", async () => {
    const user = userEvent.setup();
    const onInsertTemplate = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TemplateGalleryModal
        open={true}
        onOpenChange={onOpenChange}
        templates={[TEMPLATE_FIXTURE]}
        onInsertTemplate={onInsertTemplate}
      />,
    );

    await user.click(await screen.findByTestId("template-card-demo-template"));
    await user.click(screen.getByTestId("template-version-preview-v1.0.0"));

    expect(await screen.findByTestId("template-preview-screen")).toBeInTheDocument();
    expect(screen.getAllByText("Preview (v1.0.0)").length).toBeGreaterThan(0);
    expect(onInsertTemplate).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("template-preview-use"));

    expect(onInsertTemplate).toHaveBeenCalledWith("# Version 1 body\n\nOlder content.");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
