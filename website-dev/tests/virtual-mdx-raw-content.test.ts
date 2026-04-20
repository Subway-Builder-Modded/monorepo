import { describe, expect, it, vi, beforeEach } from "vite-plus/test";

describe("virtual-mdx-raw-content module", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns compiled content maps in normal mode", async () => {
    const mod = await import("./virtual-mdx-raw-content");

    expect(Object.keys(mod.default.rawByPath).length).toBeGreaterThan(0);
    expect(Object.keys(mod.default.frontmatterByPath).length).toBeGreaterThan(0);
  });

  it("throws when docs content validation reports icon/frontmatter errors", async () => {
    vi.doMock("@/app/config/docs/content-validation", () => ({
      collectDocsContent: () => ({
        errors: ['/content/docs/registry/page.mdx: missing required frontmatter field "icon"'],
        rawByPath: {},
        frontmatterByPath: {},
      }),
    }));

    await expect(import("./virtual-mdx-raw-content")).rejects.toThrow(/Validation failed/);
  });
});
