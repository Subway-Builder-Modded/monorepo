import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assertDocsContentValid, collectDocsContent } from "@/config/docs/content-validation";

const tempDirs: string[] = [];

function makeTempRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sbm-docs-validation-"));
  tempDirs.push(dir);
  return dir;
}

function writeMdx(root: string, relativePath: string, frontmatter: string, body = "Body") {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `---\n${frontmatter}\n---\n\n${body}\n`, "utf-8");
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("collectDocsContent", () => {
  it("passes for current repository docs content", () => {
    const contentRoot = path.resolve(process.cwd(), "content", "docs");
    const result = collectDocsContent(contentRoot);
    expect(result.errors).toEqual([]);
    expect(Object.keys(result.rawByPath).length).toBeGreaterThan(0);
    expect(Object.keys(result.frontmatterByPath).length).toBeGreaterThan(0);
  });

  it("fails when icon frontmatter is missing", () => {
    const root = makeTempRoot();
    writeMdx(root, "registry/publishing-projects.mdx", "title: Publishing\ndescription: Test");

    const result = collectDocsContent(root);
    expect(result.errors.some((e) => e.includes('missing required frontmatter field "icon"'))).toBe(
      true,
    );
  });

  it("fails when icon name is invalid", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "registry/publishing-projects.mdx",
      "title: Publishing\ndescription: Test\nicon: NotARealIcon",
    );

    const result = collectDocsContent(root);
    expect(result.errors.some((e) => e.includes('invalid icon "NotARealIcon"'))).toBe(true);
  });

  it("fails when a folder is missing same-basename landing page", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/v0.2/players/github-token.mdx",
      "title: GitHub Token\ndescription: Token docs\nicon: FileText",
    );

    const result = collectDocsContent(root);
    expect(
      result.errors.some((e) => e.includes('missing required landing page "players.mdx"')),
    ).toBe(true);
  });

  it("fails when non-versioned suite uses version folder", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "registry/v1.0/publishing-projects.mdx",
      "title: Publishing\ndescription: Test\nicon: BookText",
    );

    const result = collectDocsContent(root);
    expect(result.errors.some((e) => e.includes("must not use version folder"))).toBe(true);
  });
});

describe("assertDocsContentValid", () => {
  it("throws when validation fails", () => {
    const root = makeTempRoot();
    writeMdx(root, "registry/publishing-projects.mdx", "title: Publishing\ndescription: Test");

    expect(() => assertDocsContentValid(root)).toThrowError(/Validation failed/);
  });
});
