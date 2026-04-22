import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Note, Tip, Warning, Danger, Caution, Important } from "@/features/docs/mdx/admonition";

describe("Admonition components", () => {
  it("renders Note with default title", () => {
    render(<Note>This is a note.</Note>);
    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(screen.getByText("This is a note.")).toBeInTheDocument();
  });

  it("renders Note with custom title", () => {
    render(<Note title="Custom Title">Content here.</Note>);
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Content here.")).toBeInTheDocument();
  });

  it("renders Tip admonition", () => {
    render(<Tip>A useful tip.</Tip>);
    expect(screen.getByText("Tip")).toBeInTheDocument();
    expect(screen.getByText("A useful tip.")).toBeInTheDocument();
  });

  it("renders Warning admonition", () => {
    render(<Warning>Be careful!</Warning>);
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Be careful!")).toBeInTheDocument();
  });

  it("renders Danger admonition", () => {
    render(<Danger>Do not do this!</Danger>);
    expect(screen.getByText("Danger")).toBeInTheDocument();
  });

  it("renders Caution admonition", () => {
    render(<Caution>Proceed with caution.</Caution>);
    expect(screen.getByText("Caution")).toBeInTheDocument();
  });

  it("renders Important admonition", () => {
    render(<Important>This is important.</Important>);
    expect(screen.getByText("Important")).toBeInTheDocument();
  });

  it("applies appropriate role=note", () => {
    const { container } = render(<Note>Test</Note>);
    const admonition = container.querySelector("[role='note']");
    expect(admonition).toBeInTheDocument();
  });
});
