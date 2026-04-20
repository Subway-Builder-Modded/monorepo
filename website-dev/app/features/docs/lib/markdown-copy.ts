/**
 * Converts MDX source content to portable Markdown for clipboard copy.
 * Strips frontmatter, converts admonitions to blockquote alerts,
 * flattens tabs, and removes non-portable JSX components.
 */
export function mdxToMarkdown(raw: string): string {
  let md = raw;

  // Strip frontmatter
  md = md.replace(/^---[\s\S]*?---\n?/, "");

  // Remove explicit heading IDs: ## Heading {#some-id} -> ## Heading
  md = md.replace(/^(#{1,6}\s+.+?)\s+\{#[a-z0-9-]+\}\s*$/gm, "$1");

  // Convert admonition directives to GitHub-style blockquote alerts
  md = convertAdmonitions(md);

  // Flatten <Tabs>/<TabItem> to labeled sections
  md = flattenTabs(md);

  // Remove <Directory .../> components
  md = md.replace(/<Directory\s+[^/]*\/>/g, "");

  // Remove <DocsCardGrid>...</DocsCardGrid> blocks
  md = md.replace(/<DocsCardGrid>[\s\S]*?<\/DocsCardGrid>/g, "");

  // Convert <Image> to markdown images
  md = md.replace(
    /<Image\s+(?:[^>]*?)src="([^"]+)"(?:[^>]*?)alt="([^"]*)"(?:[^>]*?)\/?\s*>/g,
    "![$2]($1)",
  );
  md = md.replace(
    /<Image\s+(?:[^>]*?)alt="([^"]*)"(?:[^>]*?)src="([^"]+)"(?:[^>]*?)\/?\s*>/g,
    "![$1]($2)",
  );
  md = md.replace(
    /<Image\s+(?:[^>]*?)src="([^"]+)"(?:[^>]*?)\/?\s*>/g,
    "![]($1)",
  );

  // Remove <p align="center"> wrappers
  md = md.replace(/<p\s+align="center">\s*/g, "");
  md = md.replace(/\s*<\/p>/g, "");

  // Remove <RailyardTaggingRegions /> and similar custom components
  md = md.replace(/<[A-Z][A-Za-z]*\s*\/>/g, "");

  // Clean up excessive blank lines
  md = md.replace(/\n{3,}/g, "\n\n");

  return md.trim() + "\n";
}

const ADMONITION_MAP: Record<string, string> = {
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

function convertAdmonitions(md: string): string {
  // Handle nested admonitions (:::: syntax) first, then regular
  // Process from most colons down to 3
  for (let colons = 6; colons >= 3; colons--) {
    const prefix = ":".repeat(colons);
    const regex = new RegExp(
      `^${escapeRegex(prefix)}(\\w+)(?:\\[([^\\]]+)\\])?\\s*\\n([\\s\\S]*?)^${escapeRegex(prefix)}\\s*$`,
      "gm",
    );

    md = md.replace(regex, (_match, type: string, title: string | undefined, body: string) => {
      const alertType = ADMONITION_MAP[type.toLowerCase()] ?? "NOTE";
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

function flattenTabs(md: string): string {
  // Remove <Tabs> and </Tabs>
  md = md.replace(/<\/?Tabs>/g, "");

  // Convert <TabItem value="..." label="..." default?> to ### label
  md = md.replace(
    /<TabItem\s+[^>]*label="([^"]+)"[^>]*>/g,
    "\n### $1\n",
  );
  md = md.replace(/<\/TabItem>/g, "");

  return md;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
