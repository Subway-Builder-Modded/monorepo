import { readFileSync } from "node:fs";

export type JsonObject = Record<string, unknown>;

export function loadSchema(relativePath: string): JsonObject {
  return JSON.parse(
    readFileSync(new URL(relativePath, import.meta.url), "utf8"),
  ) as JsonObject;
}
