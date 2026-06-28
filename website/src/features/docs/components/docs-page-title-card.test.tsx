import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocsPageTitleCard } from "@/features/docs/components/docs-page-title-card";
import { File } from "lucide-react";

describe("DocsPageTitleCard", () => {
  it("renders the title", () => {
    render(<DocsPageTitleCard title="Getting Started" />);
    expect(screen.getByRole("heading", { name: "Getting Started" })).toBeVisible();
  });

  it("renders the description when provided", () => {
    render(<DocsPageTitleCard title="Getting Started" description="How to install the app." />);
    expect(screen.getByText("How to install the app.")).toBeVisible();
  });

  it("does not render a description element when omitted", () => {
    render(<DocsPageTitleCard title="Getting Started" />);
    expect(screen.queryByText(/install/i)).toBeNull();
  });

  it("renders the icon when provided", () => {
    render(<DocsPageTitleCard title="Getting Started" icon={File} />);
    expect(screen.getByRole("heading", { name: "Getting Started" })).toBeVisible();
    const icon = document.querySelector("svg");
    expect(icon).not.toBeNull();
  });

  it("renders a fallback icon when icon is null", () => {
    render(<DocsPageTitleCard title="Getting Started" icon={null} />);
    expect(screen.getByRole("heading", { name: "Getting Started" })).toBeVisible();
    expect(document.querySelector("svg")).not.toBeNull();
  });
});
