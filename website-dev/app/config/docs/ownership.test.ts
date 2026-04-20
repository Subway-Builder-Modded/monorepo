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

  it("keeps homepage docs config in suite config modules", () => {
    const railyardConfig = workspacePath("app", "config", "railyard", "docs.ts");
    const registryConfig = workspacePath("app", "config", "registry", "docs.ts");
    const templateModConfig = workspacePath("app", "config", "template-mod", "docs.ts");

    expect(fs.existsSync(railyardConfig)).toBe(true);
    expect(fs.existsSync(registryConfig)).toBe(true);
    expect(fs.existsSync(templateModConfig)).toBe(true);

    expect(DOCS_CONFIG.suites.railyard.homepage.heroTitle).toBeTruthy();
    expect(DOCS_CONFIG.suites.registry.homepage.heroTitle).toBeTruthy();
    expect(DOCS_CONFIG.suites["template-mod"].homepage.heroTitle).toBeTruthy();
  });

  it("has no legacy homepage data config left under features/home/data", () => {
    const legacyPath = workspacePath("app", "features", "home", "data", "docs");
    expect(fs.existsSync(legacyPath)).toBe(false);
  });

  it("covers both versioned and non-versioned suites in one canonical config map", () => {
    expect(DOCS_CONFIG.suites.railyard.versioned).toBe(true);
    expect(DOCS_CONFIG.suites["template-mod"].versioned).toBe(true);
    expect(DOCS_CONFIG.suites.registry.versioned).toBe(false);
  });
});
