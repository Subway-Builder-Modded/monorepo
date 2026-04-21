import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { DOCS_CONFIG } from "@/app/config/docs";

function workspacePath(...parts: string[]) {
  return path.resolve(process.cwd(), ...parts);
}

describe("docs config ownership and architecture", () => {
  it("keeps docs config in app/config/docs only", () => {
    const docsConfigDir = workspacePath("app", "config", "docs");
    const oldDocsConfigDir = workspacePath("app", "features", "docs", "config");

    expect(fs.existsSync(docsConfigDir)).toBe(true);
    expect(fs.existsSync(oldDocsConfigDir)).toBe(false);
  });

  it("keeps homepage docs config in suite config modules and sources shared identity centrally", async () => {
    const railyardConfig = workspacePath("app", "config", "railyard", "docs.ts");
    const registryConfig = workspacePath("app", "config", "registry", "docs.ts");
    const templateModConfig = workspacePath("app", "config", "template-mod", "docs.ts");

    expect(fs.existsSync(railyardConfig)).toBe(true);
    expect(fs.existsSync(registryConfig)).toBe(true);
    expect(fs.existsSync(templateModConfig)).toBe(true);

    // Suite docs configs should NOT redeclare hero text. Title/icon come from
    // the shared docs identity, and the description comes from each suite's
    // `*-docs` entry in site-navigation (single source of truth).
    for (const suite of Object.values(DOCS_CONFIG.suites)) {
      expect("heroTitle" in suite.homepage).toBe(false);
      expect("heroIcon" in suite.homepage).toBe(false);
      expect("description" in suite.homepage).toBe(false);
    }

    const { getSuiteDocsNavItem } = await import("@/app/config/site-navigation");
    expect(getSuiteDocsNavItem("railyard")?.description).toBeTruthy();
    expect(getSuiteDocsNavItem("registry")?.description).toBeTruthy();
    expect(getSuiteDocsNavItem("template-mod")?.description).toBeTruthy();

    const { DOCS_HOMEPAGE_TITLE, DOCS_HOMEPAGE_ICON } = await import("@/app/config/docs/shared");
    expect(DOCS_HOMEPAGE_TITLE).toBeTruthy();
    expect(DOCS_HOMEPAGE_ICON).toBeTruthy();
  });

  it("has no legacy homepage data config left under features/home/data", () => {
    const legacyPath = workspacePath("app", "features", "home", "data", "docs");
    expect(fs.existsSync(legacyPath)).toBe(false);
  });

  it("keeps docs config-layer types independent from feature-layer imports", () => {
    const validationPath = workspacePath("app", "config", "docs", "content-validation.ts");
    const source = fs.readFileSync(validationPath, "utf-8");

    expect(source).not.toContain("features/docs/lib/types");
  });

  it("covers both versioned and non-versioned suites in one canonical config map", () => {
    expect(DOCS_CONFIG.suites.railyard.versioned).toBe(true);
    expect(DOCS_CONFIG.suites["template-mod"].versioned).toBe(true);
    expect(DOCS_CONFIG.suites.registry.versioned).toBe(false);
  });
});
