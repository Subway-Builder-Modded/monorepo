export type LicensePageId = "license";

export type LicenseRouteMatch = { kind: "none" } | { kind: "page"; pageId: LicensePageId };
