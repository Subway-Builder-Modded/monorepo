/**
 * Constructs a GitHub edit URL for an MDX content file.
 *
 * @param baseUrl  The suite-specific edit base URL stored in suite config
 *                 (e.g. "https://github.com/…/edit/website/content/railyard/docs").
 * @param slug     The file slug or version-prefixed ID (e.g. "installing-railyard",
 *                 "v0.2.0"). Do NOT include the .mdx extension.
 * @param version  Optional version path segment for versioned-content suites
 *                 (e.g. "v0.2"). Pass null/undefined for unversioned content.
 */
export function constructEditUrl(
  baseUrl: string,
  slug: string,
  version?: string | null,
): string {
  if (version) {
    return `${baseUrl}/${version}/${slug}.mdx`;
  }
  return `${baseUrl}/${slug}.mdx`;
}
