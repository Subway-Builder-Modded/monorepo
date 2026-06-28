import fs from "node:fs";
import path from "node:path";
import * as icons from "lucide-react";
import { CUSTOM_ICON_NAMES } from "@subway-builder-modded/icons";

export function findMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdxFiles(fullPath));
    } else if (entry.name.endsWith(".mdx")) {
      results.push(fullPath);
    }
  }
  return results;
}

export function isValidIconExport(name: string): boolean {
  if (CUSTOM_ICON_NAMES.has(name)) return true;

  const value = (icons as Record<string, unknown>)[name];
  if (!value) return false;

  if (typeof value === "function") {
    return true;
  }

  if (typeof value === "object" && value !== null && "$$typeof" in value) {
    return true;
  }

  return false;
}
