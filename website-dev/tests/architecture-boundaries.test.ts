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

      const deepFeatureImport = source.match(/@\/features\/(home|docs)\/(?!$).+/g);
      if (!deepFeatureImport) {
        continue;
      }

      for (const hit of deepFeatureImport) {
        if (hit === "@/features/home" || hit === "@/features/docs") {
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
