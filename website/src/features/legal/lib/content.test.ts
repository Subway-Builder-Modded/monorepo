import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLegalPage } from "@/features/legal/lib/content";

const registryTermsPath = "/registry-cache/docs/terms-of-service.mdx";
const registryTermsSource = `# Terms of Service

This fixture represents the MDX served by the Registry terms-of-service endpoint.
`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("legal content", () => {
  it("loads and evaluates Registry-hosted terms of service MDX", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(registryTermsSource, {
            status: 200,
            headers: { "content-type": "text/plain" },
          }),
      ),
    );

    expect(await loadLegalPage(registryTermsPath)).toEqual(expect.any(Function));
  });
});
