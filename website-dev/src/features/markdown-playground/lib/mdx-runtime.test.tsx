import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  renderMarkdownHtml,
  renderPlainHtml,
  renderPlaygroundHtml,
} from "@/features/markdown-playground/lib/mdx-runtime";

function loadManifestDescription(relativePath: string, fallbackDescription: string) {
  const manifestPath = resolve(process.cwd(), relativePath);
  if (!existsSync(manifestPath)) {
    return fallbackDescription;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    description?: string;
  };

  return manifest.description ?? fallbackDescription;
}

describe("renderPlaygroundHtml", () => {
  it("uses canonical MDX component rendering for rich preview/html", async () => {
    const result = await renderPlaygroundHtml('<Tabs><TabItem label="One">Body</TabItem></Tabs>');

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain('role="tablist"');
  });

  it("normalizes legacy HTML attributes and renders via MDX component styling", async () => {
    const source = [
      "## Coverage",
      "",
      '<table style="width: auto">',
      '<tr><td><strong>Rows</strong></td><td align="right">59</td></tr>',
      "</table>",
      "",
      "<details>",
      "<summary>District list</summary>",
      "",
      '<table style="width: auto">',
      '<tr><th align="left">Code</th><th align="right">Population</th></tr>',
      "<tr><td>TPE</td><td>123</td></tr>",
      "</table>",
      "",
      "</details>",
    ].join("\n");

    const result = await renderPlaygroundHtml(source);

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain("overflow-x-auto rounded-lg border");
    expect(result.html).toContain("mdx-table-wrap");
    expect(result.html).toContain("table-fixed");
    expect(result.html).toContain("border-t border-border/60");
    expect(result.html).toContain("px-4 py-3");
    expect(result.html).toContain("District list");
    expect(result.html).toContain('id="coverage"');
  });

  it("wraps Details non-summary content in spoiler body for separator and inset spacing", async () => {
    const result = await renderPlaygroundHtml(
      "<details><summary>District list</summary><table><tr><td>Row</td><td>Value</td></tr></table></details>",
    );

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain("group/summary");
    expect(result.html).toContain("group-open:rotate-90");
    expect(result.html).toContain("mdx-spoiler-label");
    expect(result.html).toContain("border-t border-border/60");
    expect(result.html).toContain("px-4 py-3");
  });

  it("styles legacy HTML lists with article list classes", async () => {
    const description = loadManifestDescription(
      "public/registry/maps/mexicali/manifest.json",
      [
        "# Mexicali",
        "",
        "Highlights:",
        "",
        "- Fast regional service",
        "- Dense downtown stations",
      ].join("\n"),
    );

    const result = await renderPlaygroundHtml(description);

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain("list-disc");
    expect(result.html).toContain("leading-relaxed");
  });

  it("converts raw HTML headings to canonical MDX heading rendering", async () => {
    const result = await renderPlaygroundHtml("<h1>Guangzhou</h1>\n<h3>CAN · v1.0.0</h3>");

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain('id="guangzhou"');
    expect(result.html).toContain("text-4xl font-extrabold");
    expect(result.html).toContain("text-2xl font-semibold");
  });

  it("renders guangzhou manifest HTML through canonical heading components", async () => {
    const description = loadManifestDescription(
      "public/registry/maps/guangzhou/manifest.json",
      [
        "<h1>Guangzhou</h1>",
        "<h3>CAN · v1.0.0</h3>",
        "",
        "An urban rail network with rapid growth corridors.",
      ].join("\n"),
    );

    const result = await renderPlaygroundHtml(description);

    expect(result.warning).toBeUndefined();
    expect(result.html).toMatch(/id="[^"]*guangzhou"/i);
    expect(result.html).toContain("text-4xl font-extrabold");
    expect(result.html).toContain("Guangzhou");
  });

  it("does not center linked badge images unless explicitly requested", async () => {
    const source =
      "[![Latest Release](https://img.shields.io/github/v/release/Mpfk/subway-builder-mode-manager)](https://github.com/Mpfk/subway-builder-mode-manager/releases/latest)";

    const result = await renderPlaygroundHtml(source);

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain("img.shields.io");
    expect(result.html).not.toContain("mx-auto");
  });

  it("applies accent-aware link classes for markdown links", async () => {
    const result = await renderPlaygroundHtml(
      "Part of the [Taiwan Map Pack](https://ahkimn.github.io/subwaybuilder-tw-maps).",
    );

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain("registry-type-accent");
    expect(result.html).toContain("visited:text-");
  });

  it("keeps image centering when explicitly requested by source formatting", async () => {
    const result = await renderPlaygroundHtml(
      '<Image src="/badge.svg" alt="Badge" className="mx-auto" />',
    );

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain("mx-auto");
  });

  it("renders template placeholder syntax through rich preview styling", async () => {
    const source = [
      "---",
      "version: v1.0.0",
      "---",
      "",
      "# {{MAP_NAME}}",
      "",
      "## Coverage",
      "",
      "<table style=\"width: auto\">",
      "  <tr><td><strong>Region</strong></td><td>{{ REGION_NAME }}</td></tr>",
      "</table>",
      "",
      "{{#IF airport}}",
      "<details>",
      "<summary>Airports — {{airport_DEMAND}} ({{airport_PCT}}%)</summary>",
      "<table style=\"width: auto\">",
      "  {{ AIRPORT_ROWS }}",
      "</table>",
      "</details>",
      "{{/IF}}",
    ].join("\n");

    const result = await renderPlaygroundHtml(source);

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain("text-4xl font-extrabold");
    expect(result.html).toContain("[Map Name]");
    expect(result.html).toContain("mdx-table-wrap");
    expect(result.html).toContain("group/summary");
    expect(result.html).toContain("[Airport Demand]");
    expect(result.html).toContain("Airport Rows");
  });
});

describe("renderMarkdownHtml", () => {
  it("renders markdown content to rich html", async () => {
    const html = await renderMarkdownHtml("# Title\n\nThis is **bold** text.");

    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).not.toContain("<pre>");
  });
});

describe("renderPlainHtml", () => {
  it("falls back without pre-wrapping when mdx evaluation fails", async () => {
    const html = await renderPlainHtml("<div");

    expect(html).not.toContain("<pre>");
  });
});
