import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { collectUpdatesContent } from "@/config/updates/content-validation";

const tempDirs: string[] = [];

function makeTempRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sbm-updates-validation-"));
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

describe("collectUpdatesContent", () => {
  it("passes for current repository updates content", () => {
    const contentRoot = path.resolve(process.cwd(), "content");
    const result = collectUpdatesContent(contentRoot);
    expect(result.errors).toEqual([]);
    expect(Object.keys(result.rawByPath).length).toBeGreaterThan(0);
  });

  it("fails when tag is invalid", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/updates/v0.0.1.mdx",
      "title: Test\nicon: TrainTrack\ndate: 2026-01-01\ntag: unstable\nurl: https://example.com",
    );

    const result = collectUpdatesContent(root);
    expect(result.errors.some((e) => e.includes("release-candidate | beta | release"))).toBe(true);
  });

  it("fails when icon is invalid", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/updates/v0.0.1.mdx",
      "title: Test\nicon: NopeIcon\ndate: 2026-01-01\ntag: release-candidate\nurl: https://example.com",
    );

    const result = collectUpdatesContent(root);
    expect(result.errors.some((e) => e.includes("invalid icon"))).toBe(true);
  });

  it("fails when description is present", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/updates/v0.0.1.mdx",
      "title: Test\ndescription: Desc\nicon: TrainTrack\ndate: 2026-01-01\ntag: release-candidate\nurl: https://example.com",
    );

    const result = collectUpdatesContent(root);
    expect(result.errors.some((e) => e.includes('"description" is not allowed'))).toBe(true);
  });

  it("passes when url is omitted", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/updates/v0.0.1.mdx",
      "title: Test\nicon: TrainTrack\ndate: 2026-01-01\ntag: beta",
    );

    const result = collectUpdatesContent(root);
    expect(result.errors).toEqual([]);
  });

  it("fails when a nested folder has no landing page", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/updates/v0.2.1/rc-1.mdx",
      "title: Candidate\nicon: TrainTrack\ndate: 2026-01-01\ntag: beta\nurl: https://example.com",
    );

    const result = collectUpdatesContent(root);
    expect(result.errors.some((e) => e.includes('missing folder landing page "v0.2.1.mdx"'))).toBe(
      true,
    );
  });

  it("passes for nested updates when landing page exists", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/updates/v0.2.1.mdx",
      "title: Release\nicon: TrainTrack\ndate: 2026-01-01\ntag: release\nurl: https://example.com",
    );
    writeMdx(
      root,
      "railyard/updates/v0.2.1/rc-1.mdx",
      "title: Candidate\nicon: TrainTrack\ndate: 2026-01-01\ntag: beta\nurl: https://example.com",
    );

    const result = collectUpdatesContent(root);
    expect(result.errors).toEqual([]);
  });

  it("fails when compareUrl is provided without previousVersion", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/updates/v0.0.1.mdx",
      "title: Test\nicon: TrainTrack\ndate: 2026-01-01\ntag: beta\nurl: https://example.com\ncompareUrl: https://github.com/org/repo/compare/v0.0.0...v0.0.1#files_bucket",
    );

    const result = collectUpdatesContent(root);
    expect(
      result.errors.some((e) =>
        e.includes('"previousVersion" and "compareUrl" must both be provided or both be omitted'),
      ),
    ).toBe(true);
  });

  it("fails when previousVersion is provided without compareUrl", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/updates/v0.0.1.mdx",
      "title: Test\nicon: TrainTrack\ndate: 2026-01-01\ntag: beta\nurl: https://example.com\npreviousVersion: v0.0.0",
    );

    const result = collectUpdatesContent(root);
    expect(
      result.errors.some((e) =>
        e.includes('"previousVersion" and "compareUrl" must both be provided or both be omitted'),
      ),
    ).toBe(true);
  });

  it("fails when compareUrl is not absolute http(s)", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/updates/v0.0.1.mdx",
      "title: Test\nicon: TrainTrack\ndate: 2026-01-01\ntag: beta\nurl: https://example.com\npreviousVersion: v0.0.0\ncompareUrl: /compare/v0.0.0...v0.0.1#files_bucket",
    );

    const result = collectUpdatesContent(root);
    expect(
      result.errors.some((e) => e.includes('"compareUrl" must be an absolute http(s) URL')),
    ).toBe(true);
  });

  it("passes when both previousVersion and compareUrl are provided", () => {
    const root = makeTempRoot();
    writeMdx(
      root,
      "railyard/updates/v0.0.1.mdx",
      "title: Test\nicon: TrainTrack\ndate: 2026-01-01\ntag: beta\nurl: https://example.com\npreviousVersion: v0.0.0\ncompareUrl: https://github.com/org/repo/compare/v0.0.0...v0.0.1#files_bucket",
    );

    const result = collectUpdatesContent(root);
    expect(result.errors).toEqual([]);
  });
});
