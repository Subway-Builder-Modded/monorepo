/**
 * Converts MDX source content to portable Markdown for clipboard copy.
 *
 * Transforms applied (in order):
 * 1. Strip YAML frontmatter
 * 2. Remove explicit heading anchor IDs
 * 3. Convert ::: admonition directives → GitHub blockquote alerts
 * 4. Convert JSX admonition tags (<Note>, <Warning>, …) → GitHub blockquote alerts
 * 5. Convert <ChangelogSection type="…"> → ### heading + body
 * 6. Convert <Spoiler title="…"> → portable <details>/<summary>
 * 7. Flatten <Tabs>/<TabItem> → section headings
 * 8. Strip <Directory>, <DocsDirectory> (no portable representation)
 * 9. Strip <DocsCardGrid>…</DocsCardGrid>
 * 10. Convert <Image …/> → Markdown image syntax
 * 11. Unwrap <p align="center"> wrappers
 * 12. Strip remaining unknown uppercase JSX wrappers, preserving inner text
 * 13. Normalise excessive blank lines
 */
export function mdxToMarkdown(raw: string): string {
  let md = raw;

  // 1. Strip frontmatter
  md = md.replace(/^---[\s\S]*?---\n?/, "");

  // 2. Remove explicit heading IDs: ## Heading {#some-id} -> ## Heading
  md = md.replace(/^(#{1,6}\s+.+?)\s+\{#[a-z0-9-]+\}\s*$/gm, "$1");

  // 3. Convert admonition directives (:::type … :::) to GitHub-style blockquote alerts
  md = convertAdmonitionDirectives(md);

  // 4. Convert JSX admonition component tags (<Note>, <Warning>, …)
  md = convertAdmonitionTags(md);

  // 5. Convert <ChangelogSection type="…"> blocks → ### Heading + body
  md = convertChangelogSections(md);

  // 6. Convert <Spoiler title="…"> → <details>/<summary>
  md = convertSpoilers(md);

  // 7. Flatten <Tabs>/<TabItem> to labeled sections
  md = flattenTabs(md);

  // 8. Strip <Directory …/> and <DocsDirectory …/> (multi-line safe)
  md = md.replace(/<(?:DocsDirectory|Directory)(?:\s[^>]*)?\s*\/>/gs, "");
  md = md.replace(/<(?:DocsDirectory|Directory)(?:\s[^>]*)?>([\s\S]*?)<\/(?:DocsDirectory|Directory)>/g, "");

  // 9. Remove <DocsCardGrid>…</DocsCardGrid> blocks
  md = md.replace(/<DocsCardGrid(?:\s[^>]*)?>[\s\S]*?<\/DocsCardGrid>/g, "");

  // 10. Convert <Image …/> to Markdown images (handles multi-line props)
  md = convertImageTags(md);

  // 11. Remove <p align="center"> wrappers
  md = md.replace(/<p\s+align="center">\s*/g, "");
  md = md.replace(/\s*<\/p>/g, "");

  // 12. Strip remaining unknown uppercase JSX wrappers, preserving inner text.
  //     Self-closing tags with no content are dropped; block tags keep their children.
  md = stripUnknownJsxWrappers(md);

  // 13. Clean up excessive blank lines
  md = md.replace(/\n{3,}/g, "\n\n");

  return md.trim() + "\n";
}

// ---------------------------------------------------------------------------
// Admonition directive (:::type … :::)
// ---------------------------------------------------------------------------

const ADMONITION_TYPE_MAP: Record<string, string> = {
  note: "NOTE",
  tip: "TIP",
  important: "IMPORTANT",
  warning: "WARNING",
  caution: "CAUTION",
  danger: "CAUTION",
  info: "NOTE",
  success: "TIP",
  deprecated: "WARNING",
  bug: "WARNING",
  example: "NOTE",
  announcement: "NOTE",
};

function convertAdmonitionDirectives(md: string): string {
  // Handle nested admonitions (:::: syntax) first, process from most colons down to 3
  for (let colons = 6; colons >= 3; colons--) {
    const prefix = ":".repeat(colons);
    const regex = new RegExp(
      `^${escapeRegex(prefix)}(\\w+)(?:\\[([^\\]]+)\\])?\\s*\\n([\\s\\S]*?)^${escapeRegex(prefix)}\\s*$`,
      "gm",
    );

    md = md.replace(regex, (_match, type: string, title: string | undefined, body: string) => {
      const alertType = ADMONITION_TYPE_MAP[type.toLowerCase()] ?? "NOTE";
      const titleLine = title ? `**${title}**\n>\n` : "";
      const indented = body
        .trim()
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");

      return `> [!${alertType}]\n> ${titleLine}${indented}`;
    });
  }

  return md;
}

// ---------------------------------------------------------------------------
// JSX admonition component tags (<Note>, <Warning>, …)
// ---------------------------------------------------------------------------

/**
 * Maps JSX admonition component names (as registered in articleMdxComponents)
 * to their GitHub blockquote alert type.
 */
const ADMONITION_COMPONENT_MAP: Record<string, string> = {
  Note: "NOTE",
  Tip: "TIP",
  Important: "IMPORTANT",
  Warning: "WARNING",
  Caution: "CAUTION",
  Danger: "CAUTION",
  InfoAdmonition: "NOTE",
  Success: "TIP",
  Deprecated: "WARNING",
  Alert: "NOTE",
  Example: "NOTE",
  Announcement: "NOTE",
};

function convertAdmonitionTags(md: string): string {
  for (const [name, alertType] of Object.entries(ADMONITION_COMPONENT_MAP)) {
    // Block form: <Name> … </Name>  (title prop optional, multi-line body)
    const blockRe = new RegExp(
      `<${name}(?:\\s+[^>]*?title="([^"]*)"[^>]*?|\\s+[^>]*?)?>([\\s\\S]*?)<\\/${name}>`,
      "g",
    );
    md = md.replace(blockRe, (_match, title: string | undefined, body: string) => {
      const titleLine = title?.trim() ? `**${title.trim()}**\n>\n` : "";
      const indented = body
        .trim()
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
      return `> [!${alertType}]\n> ${titleLine}${indented}`;
    });

    // Self-closing form: <Name /> or <Name prop="…" />
    const selfClosingRe = new RegExp(`<${name}(?:\\s[^/]*)?/>`, "g");
    md = md.replace(selfClosingRe, "");
  }

  return md;
}

// ---------------------------------------------------------------------------
// ChangelogSection
// ---------------------------------------------------------------------------

/**
 * Inline category title lookup matching CHANGELOG_CATEGORIES in
 * src/config/updates/changelog-categories.ts.  The converter must not import
 * runtime config to stay a pure string transformer.
 */
const CHANGELOG_CATEGORY_TITLES: Record<string, string> = {
  features: "Features",
  improvements: "Improvements",
  bugfixes: "Bugfixes",
  notes: "Other Notes",
};

function convertChangelogSections(md: string): string {
  return md.replace(
    /<ChangelogSection\s+type="([^"]+)"[^>]*>([\s\S]*?)<\/ChangelogSection>/g,
    (_match, type: string, body: string) => {
      const title =
        CHANGELOG_CATEGORY_TITLES[type.trim().toLowerCase()] ??
        type.trim().charAt(0).toUpperCase() + type.trim().slice(1);
      return `### ${title}\n\n${body.trim()}`;
    },
  );
}

// ---------------------------------------------------------------------------
// Spoiler
// ---------------------------------------------------------------------------

function convertSpoilers(md: string): string {
  return md.replace(
    /<Spoiler(?:\s+[^>]*?title="([^"]*)"[^>]*?|\s+[^>]*?)?>( [\s\S]*?)<\/Spoiler>/g,
    (_match, title: string | undefined, body: string) => {
      const summary = title?.trim() || "Details";
      return `<details>\n<summary>${summary}</summary>\n\n${body.trim()}\n\n</details>`;
    },
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function flattenTabs(md: string): string {
  // Remove <Tabs …> and </Tabs>
  md = md.replace(/<Tabs(?:\s[^>]*)?>|<\/Tabs>/g, "");

  // Convert <TabItem value="…" label="…" default?> to ### label
  md = md.replace(/<TabItem\s+[^>]*label="([^"]+)"[^>]*>/g, "\n### $1\n");
  md = md.replace(/<\/TabItem>/g, "");

  return md;
}

// ---------------------------------------------------------------------------
// Image
// ---------------------------------------------------------------------------

function convertImageTags(md: string): string {
  // Normalise multi-line self-closing <Image …/> tags to a single line before matching
  // so attribute-order variants all hit the same regex passes below.
  const normalised = md.replace(/<Image\s+([\s\S]*?)\/>/g, (_m, attrs: string) => {
    const flat = attrs.replace(/\s+/g, " ").trim();
    return `<Image ${flat}/>`;
  });

  let out = normalised;

  // src then alt
  out = out.replace(
    /<Image\s+(?:[^>]*?)src="([^"]+)"(?:[^>]*?)alt="([^"]*)"(?:[^>]*?)\/>/g,
    "![$2]($1)",
  );
  // alt then src
  out = out.replace(
    /<Image\s+(?:[^>]*?)alt="([^"]*)"(?:[^>]*?)src="([^"]+)"(?:[^>]*?)\/>/g,
    "![$1]($2)",
  );
  // src only (no alt)
  out = out.replace(/<Image\s+(?:[^>]*?)src="([^"]+)"(?:[^>]*?)\/>/g, "![]($1)");

  return out;
}

// ---------------------------------------------------------------------------
// Unknown JSX wrapper stripper
// ---------------------------------------------------------------------------

/**
 * Strips opening and closing tags of unrecognised uppercase JSX components
 * while preserving the inner content.  Self-closing tags with no children
 * are dropped entirely.
 *
 * Components that have already been handled by earlier passes (admonitions,
 * ChangelogSection, Spoiler, Tabs, Directory, Image, DocsCardGrid) are gone
 * before this runs, so this is a safe catch-all for everything else.
 */
function stripUnknownJsxWrappers(md: string): string {
  // Self-closing: <UnknownComponent prop="…" /> — drop entirely
  let out = md.replace(/<[A-Z][A-Za-z0-9.]*(?:\s[^/]*)?\/>/g, "");

  // Block form: <UnknownComponent …>inner</UnknownComponent> — keep inner text
  // Repeat to handle nested unknown components (outer pass then inner pass)
  for (let pass = 0; pass < 4; pass++) {
    out = out.replace(
      /<([A-Z][A-Za-z0-9.]*)(?:\s[^>]*)?>( [\s\S]*?)<\/\1>/g,
      (_match, _tag, inner: string) => inner,
    );
  }

  return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
