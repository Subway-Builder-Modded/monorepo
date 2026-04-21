import { describe, expect, it } from "vite-plus/test";
import {
  getDocsSuiteConfig,
  getDocsVersion,
  getLatestVersion,
  getVisibleVersions,
  getSidebarOrder,
  isDocsSuiteId,
  isVersionedDocsSuite,
} from "@/app/config/docs";

describe("isDocsSuiteId", () => {
  it("returns true for valid suite ids", () => {
    expect(isDocsSuiteId("railyard")).toBe(true);
    expect(isDocsSuiteId("registry")).toBe(true);
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
    expect(config!.versioned).toBe(true);
    if (config && config.versioned) {
      expect(config.latestVersion).toBe("v0.2");
    }
  });

  it("returns config for registry", () => {
    const config = getDocsSuiteConfig("registry");
    expect(config).not.toBeNull();
    expect(config!.suiteId).toBe("registry");
    expect(config!.versioned).toBe(false);
  });

  it("returns config for template-mod", () => {
    const config = getDocsSuiteConfig("template-mod");
    expect(config).not.toBeNull();
    expect(config!.suiteId).toBe("template-mod");
    expect(config!.versioned).toBe(true);
    if (config && config.versioned) {
      expect(config.latestVersion).toBe("v1.0");
    }
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

  it("returns null for non-versioned registry", () => {
    expect(getDocsVersion("registry", "v1.0")).toBeNull();
  });
});

describe("getLatestVersion", () => {
  it("returns latest version for railyard", () => {
    expect(getLatestVersion("railyard")).toBe("v0.2");
  });

  it("returns latest version for template-mod", () => {
    expect(getLatestVersion("template-mod")).toBe("v1.0");
  });

  it("returns null for non-versioned registry", () => {
    expect(getLatestVersion("registry")).toBeNull();
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

  it("returns empty array for non-versioned registry", () => {
    const versions = getVisibleVersions("registry");
    expect(versions).toEqual([]);
  });
});

describe("getSidebarOrder", () => {
  it("returns sidebar order for railyard v0.2", () => {
    const order = getSidebarOrder("railyard", "v0.2");
    expect(order).toBeDefined();
    // First item should be the installing-railyard section group with children
    expect(typeof order[0]).toBe("object");
    if (typeof order[0] === "object") {
      expect(order[0].key).toBe("installing-railyard");
      expect(order[0].children?.length).toBeGreaterThan(0);
    }
  });

  it("returns sidebar order for template-mod v1.0", () => {
    const order = getSidebarOrder("template-mod", "v1.0");
    expect(order.length).toBe(6);
    expect(order[0]).toBe("getting-started");
  });

  it("returns sidebar order for non-versioned registry", () => {
    const order = getSidebarOrder("registry", null);
    expect(order.length).toBe(5);
    expect(order[0]).toBe("publishing-projects");
  });

  it("returns empty array for unknown version", () => {
    const order = getSidebarOrder("railyard", "v9.9");
    expect(order).toEqual([]);
  });
});

describe("isVersionedDocsSuite", () => {
  it("returns true for versioned suites", () => {
    expect(isVersionedDocsSuite("railyard")).toBe(true);
    expect(isVersionedDocsSuite("template-mod")).toBe(true);
  });

  it("returns false for non-versioned suite", () => {
    expect(isVersionedDocsSuite("registry")).toBe(false);
  });
});
