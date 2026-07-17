import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLegalPage } from "@/features/legal/lib/content";

const registryTermsPath = "/registry-cache/docs/terms-of-service.mdx";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("legal content", () => {
  it("loads and evaluates Registry-hosted terms of service MDX", async () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "public/registry-cache/docs/terms-of-service.mdx"),
      "utf8",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(source, { status: 200, headers: { "content-type": "text/plain" } }),
      ),
    );

    expect(await loadLegalPage(registryTermsPath)).toEqual(expect.any(Function));
  });
});
