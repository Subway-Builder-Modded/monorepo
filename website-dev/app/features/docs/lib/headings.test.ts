import { describe, expect, it } from "vite-plus/test";
import { extractHeadings, slugify } from "@/app/features/docs/lib/headings";

describe("slugify", () => {
  it("converts text to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("handles special characters", () => {
    expect(slugify("Step 1 - Downloading Railyard")).toBe(
      "step-1-downloading-railyard",
    );
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("collapses whitespace into hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("multi  space")).toBe("multi-space");
  });
});

describe("extractHeadings", () => {
  it("extracts h2-h4 headings", () => {
    const raw = `---
title: Test
---

## First Section

Some text.

### Subsection

More text.

#### Deep Section

Even more text.

# Title (ignored)

## Another Section
`;

    const headings = extractHeadings(raw);
    expect(headings).toEqual([
      { id: "first-section", text: "First Section", level: 2 },
      { id: "subsection", text: "Subsection", level: 3 },
      { id: "deep-section", text: "Deep Section", level: 4 },
      { id: "another-section", text: "Another Section", level: 2 },
    ]);
  });

  it("handles explicit heading IDs", () => {
    const raw = `## Step 1 {#downloading-railyard}`;
    const headings = extractHeadings(raw);
    expect(headings[0].id).toBe("downloading-railyard");
  });

  it("returns empty array for no headings", () => {
    expect(extractHeadings("Just some text.")).toEqual([]);
  });

  it("handles headings with inline code", () => {
    const raw = "## Using `custom-url`";
    const headings = extractHeadings(raw);
    expect(headings[0].text).toBe("Using `custom-url`");
    expect(headings[0].id).toBe("using-custom-url");
  });
});
