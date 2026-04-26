import { describe, expect, it } from "vitest";
import {
  __resetRegistryTemplatesCacheForTests,
  getRegistryTemplateBySlug,
  getRegistryTemplates,
} from "@/lib/registry/templates";

describe("registry templates loader", () => {
  it("loads templates from content/registry/templates", () => {
    __resetRegistryTemplatesCacheForTests();
    const templates = getRegistryTemplates();

    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some((template) => template.slug === "release-notes")).toBe(true);
  });

  it("returns typed template body for selected slug", () => {
    __resetRegistryTemplatesCacheForTests();
    const template = getRegistryTemplateBySlug("docs-page");

    expect(template).not.toBeNull();
    expect(template?.body).toContain("# Document Title");
  });
});
