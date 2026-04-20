import { describe, expect, it } from "vite-plus/test";
import {
  getDocsSuiteConfig,
  getDocsVersion,
  getLatestVersion,
  getVisibleVersions,
  getSidebarOrder,
  isDocsSuiteId,
} from "@/app/features/docs/config";

describe("isDocsSuiteId", () => {
  it("returns true for valid suite ids", () => {
    expect(isDocsSuiteId("railyard")).toBe(true);
    expect(isDocsSuiteId("template-mod")).toBe(true);
  });

  it("returns false for invalid suite ids", () => {
    expect(isDocsSuiteId("general")).toBe(false);
    expect(isDocsSuiteId("unknown")).toBe(false);
    expect(isDocsSuiteId("")).toBe(false);
  });
});

describe("getDocsSuiteConfig", () => {
  it("returns config for railyard", () => {
    const config = getDocsSuiteConfig("railyard");
    expect(config).not.toBeNull();
    expect(config!.suiteId).toBe("railyard");
    expect(config!.enabled).toBe(true);
    expect(config!.latestVersion).toBe("v0.2");
  });

  it("returns config for template-mod", () => {
    const config = getDocsSuiteConfig("template-mod");
    expect(config).not.toBeNull();
    expect(config!.suiteId).toBe("template-mod");
    expect(config!.latestVersion).toBe("v1.0");
  });
});

describe("getDocsVersion", () => {
  it("finds existing version", () => {
    const version = getDocsVersion("railyard", "v0.2");
    expect(version).not.toBeNull();
    expect(version!.value).toBe("v0.2");
    expect(version!.status).toBe("latest");
  });

  it("finds deprecated version", () => {
    const version = getDocsVersion("railyard", "v0.1");
    expect(version).not.toBeNull();
    expect(version!.status).toBe("deprecated");
  });

  it("returns null for nonexistent version", () => {
    expect(getDocsVersion("railyard", "v9.9")).toBeNull();
  });
});

describe("getLatestVersion", () => {
  it("returns latest version for railyard", () => {
    expect(getLatestVersion("railyard")).toBe("v0.2");
  });

  it("returns latest version for template-mod", () => {
    expect(getLatestVersion("template-mod")).toBe("v1.0");
  });
});

describe("getVisibleVersions", () => {
  it("returns all non-hidden versions", () => {
    const versions = getVisibleVersions("railyard");
    expect(versions.length).toBe(2);
    expect(versions[0].value).toBe("v0.2");
    expect(versions[1].value).toBe("v0.1");
  });

  it("returns single version for template-mod", () => {
    const versions = getVisibleVersions("template-mod");
    expect(versions.length).toBe(1);
    expect(versions[0].value).toBe("v1.0");
  });
});

describe("getSidebarOrder", () => {
  it("returns sidebar order for railyard v0.2", () => {
    const order = getSidebarOrder("railyard", "v0.2");
    expect(order).toBeDefined();
    expect(order.length).toBe(2);
    // First item should be players section
    expect(typeof order[0]).toBe("object");
    if (typeof order[0] === "object") {
      expect(order[0].key).toBe("players");
    }
  });

  it("returns sidebar order for template-mod v1.0", () => {
    const order = getSidebarOrder("template-mod", "v1.0");
    expect(order.length).toBe(6);
    expect(order[0]).toBe("getting-started");
  });

  it("returns empty array for unknown version", () => {
    const order = getSidebarOrder("railyard", "v9.9");
    expect(order).toEqual([]);
  });
});
