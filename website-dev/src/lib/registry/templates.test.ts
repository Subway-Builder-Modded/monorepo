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
    expect(templates.some((template) => template.slug === "map-description")).toBe(true);
  });

  it("returns versioned template model for selected slug", () => {
    __resetRegistryTemplatesCacheForTests();
    const template = getRegistryTemplateBySlug("map-description");

    expect(template).not.toBeNull();
    expect(template?.versions.length).toBeGreaterThan(0);
    expect(template?.latestVersion).toBe("v1.0.0");
    expect(template?.versions[0]?.body).toContain("## Coverage");
  });
});
