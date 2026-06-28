import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = path.resolve(process.cwd(), "src");
const CHECK_EXTENSIONS = new Set([".ts", ".tsx"]);

function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (!CHECK_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function toPosixRelative(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

const FEATURE_NAMES = ["home", "docs", "updates", "credits", "contribute", "license", "content"];
const FEATURE_BARREL_ROOTS = new Set(FEATURE_NAMES.map((f) => `@/features/${f}`));
const FEATURE_DEEP_IMPORT_RE = new RegExp(
  `@\\/features\\/(${FEATURE_NAMES.join("|")})\\/(?!$).+`,
  "g",
);

describe("architecture import boundaries", () => {
  it("prevents non-feature layers from deep-importing feature internals", () => {
    const files = listSourceFiles(SRC_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const rel = toPosixRelative(file);
      if (rel.startsWith("src/features/")) {
        continue;
      }

      const source = fs.readFileSync(file, "utf8");

      const deepFeatureImport = source.match(FEATURE_DEEP_IMPORT_RE);
      if (!deepFeatureImport) {
        continue;
      }

      for (const hit of deepFeatureImport) {
        if (FEATURE_BARREL_ROOTS.has(hit)) {
          continue;
        }

        violations.push(`${rel}: ${hit}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("prevents shared layers (lib/config) from importing any feature internals", () => {
    const files = listSourceFiles(SRC_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const rel = toPosixRelative(file);
      if (!rel.startsWith("src/lib/") && !rel.startsWith("src/config/")) {
        continue;
      }

      const source = fs.readFileSync(file, "utf8");
      const deepFeatureImport = source.match(FEATURE_DEEP_IMPORT_RE);
      if (!deepFeatureImport) {
        continue;
      }

      for (const hit of deepFeatureImport) {
        if (FEATURE_BARREL_ROOTS.has(hit)) {
          continue;
        }

        violations.push(`${rel}: ${hit}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("prevents non-shell files from deep-importing shell internals", () => {
    const files = listSourceFiles(SRC_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const rel = toPosixRelative(file);
      if (rel.startsWith("src/shell/")) {
        continue;
      }

      const source = fs.readFileSync(file, "utf8");
      const deepShellImport = source.match(/@\/shell\/(?!$).+/g);
      if (!deepShellImport) {
        continue;
      }

      for (const hit of deepShellImport) {
        if (hit === "@/shell") {
          continue;
        }

        violations.push(`${rel}: ${hit}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
