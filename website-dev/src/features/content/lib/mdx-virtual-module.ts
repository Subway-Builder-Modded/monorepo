/**
 * Type aliases for the virtual MDX content modules injected by the Vite plugin.
 * Both the docs and updates content libraries import these instead of
 * redeclaring the same shapes independently.
 */

/** Shape of a lazily-imported MDX module (e.g. from import.meta.glob). */
export type RawMdxModule = {
  default: React.ComponentType;
};

/** Result type of import.meta.glob for MDX files. */
export type MdxGlobResult = Record<string, () => Promise<RawMdxModule>>;

/**
 * Shape of the `virtual:mdx-raw-content` module injected by mdxRawContentPlugin.
 * TFrontmatter is intentionally generic here so each feature can narrow it
 * to its own typed frontmatter interface.
 */
export type MdxRawContentModule<TFrontmatter = Record<string, unknown>> = {
  rawByPath: Record<string, string>;
  frontmatterByPath: Record<string, TFrontmatter>;
};
