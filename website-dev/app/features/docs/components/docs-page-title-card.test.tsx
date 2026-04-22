import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { DocsPageTitleCard } from "@/app/features/docs/components/docs-page-title-card";
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
    // Icon is rendered inside an aria-hidden span; the heading is still accessible
    expect(screen.getByRole("heading", { name: "Getting Started" })).toBeVisible();
    // The icon wrapper span is present in the DOM
    const iconWrapper = document.querySelector("span.inline-flex");
    expect(iconWrapper).not.toBeNull();
    expect(iconWrapper?.className).toContain("text-[var(--suite-accent-light)]");
  });

  it("renders without an icon wrapper's svg when icon is null", () => {
    render(<DocsPageTitleCard title="Getting Started" icon={null} />);
    expect(screen.getByRole("heading", { name: "Getting Started" })).toBeVisible();
    // No svg rendered
    expect(document.querySelector("svg")).toBeNull();
  });
});
