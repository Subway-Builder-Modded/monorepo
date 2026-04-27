import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectRegistryTemplatesContent } from "@/config/registry/template-content-validation";

function writeTemplate(root: string, relativePath: string, frontmatter: string, body = "Body") {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `---\n${frontmatter}\n---\n\n${body}\n`, "utf8");
}

describe("collectRegistryTemplatesContent", () => {
  it("fails clearly when frontmatter is invalid", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "registry-template-validation-"));

    // A broken listing.mdx
    writeTemplate(
      root,
      "registry/templates/broken/listing.mdx",
      ["title: ''", "author: ''", "icon: NotAnIcon", "verified: maybe"].join("\n"),
    );

    // A broken version file
    writeTemplate(root, "registry/templates/broken/v1.mdx", ["version: ''"].join("\n"));

    const result = collectRegistryTemplatesContent(root);

    expect(result.errors.some((error) => error.includes("invalid icon"))).toBe(true);
    expect(result.errors.some((error) => error.includes("verified"))).toBe(true);
    expect(result.errors.some((error) => error.includes("version"))).toBe(true);
    expect(result.errors.some((error) => error.includes("datePublished"))).toBe(true);
  });
});
