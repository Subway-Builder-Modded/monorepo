import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkDirective from "remark-directive";
import rehypePrettyCode from "rehype-pretty-code";
import { defineConfig } from "vite-plus";
import type { Plugin } from "vite-plus";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VIRTUAL_RAW_MDX_ID = "virtual:mdx-raw-content";
const RESOLVED_VIRTUAL_RAW_MDX_ID = "\0" + VIRTUAL_RAW_MDX_ID;
const SITE_ORIGIN = process.env.VITE_SITE_ORIGIN ?? "https://subwaybuildermodded.com";
const STATIC_REGISTRY_DETAIL_TABS = [
  "description",
  "analytics",
  "gallery",
  "versions",
  "map",
  "details",
];
const STATIC_REGISTRY_AUTHOR_TABS = ["projects", "analytics"];
const DEFAULT_SITE_TITLE = "Subway Builder Modded";
const DEFAULT_SITE_DESCRIPTION = "The complete hub for everything modded in Subway Builder.";
const STATIC_DOCS_LATEST_VERSIONS: Record<string, string> = {
  railyard: "v0.2",
  "template-mod": "v1.0",
};
const STATIC_SUITE_METADATA = {
  general: {
    title: "General",
    imagePath: "/logo.svg",
    homeDescription: DEFAULT_SITE_DESCRIPTION,
  },
  railyard: {
    title: "Railyard",
    imagePath: "/images/embeds/railyard.svg",
    homeDescription: "Discover the all-in-one manager for Subway Builder community-made content.",
  },
  registry: {
    title: "Registry",
    imagePath: "/images/embeds/registry.svg",
    homeDescription: "Discover the GitHub-hosted registry powering Railyard and its services.",
  },
  "template-mod": {
    title: "Template Mod",
    imagePath: "/images/embeds/template-mod.svg",
    homeDescription:
      "Discover the all-inclusive TypeScript template for creating Subway Builder mods with ease.",
  },
  website: {
    title: "Website",
    imagePath: "/images/embeds/website.svg",
    homeDescription:
      "Explore the Subway Builder Modded website, its changelog, and public analytics.",
  },
  depot: {
    title: "Depot",
    imagePath: "/images/embeds/depot.svg",
    homeDescription:
      "Discover the core Python library powering the Subway Builder Modded map creation ecosystem.",
  },
} satisfies Record<string, { homeDescription: string; imagePath: string; title: string }>;
const STATIC_NAV_METADATA: Record<string, { description: string; title: string }> = {
  "/": { title: DEFAULT_SITE_TITLE, description: DEFAULT_SITE_DESCRIPTION },
  "/community": {
    title: "Community",
    description:
      "Join the Subway Builder Modded Discord, follow project activity, and see how the community is growing.",
  },
  "/credits": {
    title: "Credits",
    description: "The maintainers and contributors helping Subway Builder Modded move forward.",
  },
  "/contribute": {
    title: "Contribute",
    description:
      "Help improve Subway Builder Modded through code, documentation, testing, and community contributions.",
  },
  "/license": {
    title: "License",
    description: "Terms and licensing information for Subway Builder Modded projects.",
  },
  "/terms-of-service": {
    title: "Terms of Service",
    description:
      "The terms of service, guidelines, and regulations of Subway Builder Modded and its services.",
  },
  "/railyard": {
    title: "Railyard",
    description: STATIC_SUITE_METADATA.railyard.homeDescription,
  },
  "/railyard/docs": {
    title: "Docs",
    description: "The official documentation for the Railyard app.",
  },
  "/railyard/updates": {
    title: "Updates",
    description: "View the changelogs and release notes for the Railyard app.",
  },
  "/railyard/analytics": {
    title: "Analytics",
    description: "In-depth release and download analytics for the Railyard app.",
  },
  "/registry": {
    title: "Registry",
    description: STATIC_SUITE_METADATA.registry.homeDescription,
  },
  "/registry/authors": {
    title: "Creators",
    description: "Search the Registry author and project database.",
  },
  "/registry/authors/projects": {
    title: "Creators",
    description: "Search the Registry author and project database.",
  },
  "/registry/docs": {
    title: "Docs",
    description: "The official documentation for the Registry powering Subway Builder Modded.",
  },
  "/registry/analytics": {
    title: "Analytics",
    description: "View in-depth analytics and insights for Registry-hosted content.",
  },
  "/registry/trending": {
    title: "Trending",
    description: "View the most trending content in the Registry based on recent activity.",
  },
  "/registry/world-map": {
    title: "World Map",
    description: "Interactively explore all of the user-submitted maps available in the Registry.",
  },
  "/registry/markdown-playground": {
    title: "Playground",
    description: "Experiment with Markdown content in a live preview environment.",
  },
  "/template-mod": {
    title: "Template Mod",
    description: STATIC_SUITE_METADATA["template-mod"].homeDescription,
  },
  "/template-mod/docs": {
    title: "Docs",
    description: "The official documentation for the Template Mod.",
  },
  "/template-mod/updates": {
    title: "Updates",
    description: "View the changelogs and release notes for the Template Mod.",
  },
  "/website": {
    title: "Website",
    description: STATIC_SUITE_METADATA.website.homeDescription,
  },
  "/website/updates": {
    title: "Updates",
    description: "View the changelogs and release notes for the Website.",
  },
  "/website/analytics": {
    title: "Analytics",
    description: "In-depth release and download analytics for the Website.",
  },
  "/depot": {
    title: "Depot",
    description: STATIC_SUITE_METADATA.depot.homeDescription,
  },
  "/depot/updates": {
    title: "Updates",
    description: "View the changelogs and release notes for Depot.",
  },
};

type StaticRegistryManifest = {
  description?: string;
  gallery?: string[];
  is_test?: boolean;
  name?: string;
  source?: string;
};

type StaticRegistryIntegrity = {
  listings?: Record<
    string,
    {
      has_complete_version?: boolean;
      versions?: Record<string, { is_complete?: boolean }>;
    }
  >;
};

type StaticPageMetadata = {
  description: string;
  imagePath: string;
  pageTitle: string;
  pathname: string;
  suiteId: keyof typeof STATIC_SUITE_METADATA;
  title: string;
};

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, SITE_ORIGIN).toString();
}

function upsertMetaTag(
  html: string,
  attr: "name" | "property",
  key: string,
  content: string,
): string {
  const escaped = escapeHtmlAttribute(content);
  const tag = `<meta ${attr}="${key}" content="${escaped}" />`;
  const pattern = new RegExp(`<meta\\s+${attr}=["']${key}["'][^>]*>`, "i");

  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function upsertCanonicalLink(html: string, href: string): string {
  const tag = `<link rel="canonical" href="${escapeHtmlAttribute(href)}" />`;
  const pattern = /<link\s+rel=["']canonical["'][^>]*>/i;

  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function applyStaticMetadata(
  html: string,
  metadata: { description: string; imagePath: string; pageTitle: string; pathname: string },
): string {
  const pageUrl = toAbsoluteUrl(metadata.pathname);
  const imageUrl = toAbsoluteUrl(metadata.imagePath);
  let nextHtml = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtmlText(metadata.pageTitle)}</title>`,
  );

  nextHtml = upsertMetaTag(nextHtml, "name", "description", metadata.description);
  nextHtml = upsertMetaTag(nextHtml, "property", "og:type", "website");
  nextHtml = upsertMetaTag(nextHtml, "property", "og:site_name", "Subway Builder Modded");
  nextHtml = upsertMetaTag(nextHtml, "property", "og:title", metadata.pageTitle);
  nextHtml = upsertMetaTag(nextHtml, "property", "og:description", metadata.description);
  nextHtml = upsertMetaTag(nextHtml, "property", "og:image", imageUrl);
  nextHtml = upsertMetaTag(nextHtml, "property", "og:url", pageUrl);
  nextHtml = upsertMetaTag(nextHtml, "name", "twitter:card", "summary_large_image");
  nextHtml = upsertMetaTag(nextHtml, "name", "twitter:title", metadata.pageTitle);
  nextHtml = upsertMetaTag(nextHtml, "name", "twitter:description", metadata.description);
  nextHtml = upsertMetaTag(nextHtml, "name", "twitter:image", imageUrl);
  nextHtml = upsertMetaTag(nextHtml, "name", "twitter:url", pageUrl);

  return upsertCanonicalLink(nextHtml, pageUrl);
}

function normalizeStaticRoute(route: string): string {
  const pathOnly = route.split(/[?#]/)[0] || "/";
  const withLeadingSlash = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  return withLeadingSlash !== "/" && withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

function getStaticRouteOutputPath(outDir: string, route: string): string {
  const normalized = normalizeStaticRoute(route);
  if (normalized === "/") return path.join(outDir, "index.html");
  return path.join(outDir, ...normalized.split("/").filter(Boolean), "index.html");
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function getStaticSuiteId(route: string): keyof typeof STATIC_SUITE_METADATA {
  const firstSegment = normalizeStaticRoute(route).split("/").filter(Boolean)[0];
  return firstSegment && firstSegment in STATIC_SUITE_METADATA
    ? (firstSegment as keyof typeof STATIC_SUITE_METADATA)
    : "general";
}

function formatStaticPageTitle(title: string, suiteId: keyof typeof STATIC_SUITE_METADATA): string {
  const suite = STATIC_SUITE_METADATA[suiteId];
  return suiteId === "general" || title === suite.title ? title : `${title} | ${suite.title}`;
}

function parseFrontmatter(filePath: string): Record<string, string> | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/))
      .filter((entry): entry is RegExpMatchArray => Boolean(entry))
      .map((entry) => [entry[1], entry[2]?.trim().replace(/^["']|["']$/g, "") ?? ""]),
  );
}

function toPlainTextExcerpt(markdown: string, maxLength = 180): string {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, maxLength - 1).trimEnd()}…`;
}

function resolveRegistryThumbnail(
  routeSegment: string,
  id: string,
  gallery: string[] | undefined,
): string | null {
  const first = gallery?.[0]?.trim();
  if (!first) return null;
  if (/^https?:\/\//i.test(first) || first.startsWith("/")) return first;
  return `/registry-cache/${routeSegment}/${encodeURIComponent(id)}/${first.replace(/^\/+/, "")}`;
}

function resolveStaticDocsMetadata(
  route: string,
  contentDir: string,
): { description: string; title: string } | null {
  const parts = normalizeStaticRoute(route).split("/").filter(Boolean);
  if (parts[1] !== "docs" || parts.length < 3) return null;

  const latestVersion = STATIC_DOCS_LATEST_VERSIONS[parts[0] ?? ""];
  const docParts =
    parts[2] === "latest" && latestVersion ? [latestVersion, ...parts.slice(3)] : parts.slice(2);

  if (parts[2] === "latest" && docParts.length === 1) {
    return STATIC_NAV_METADATA[`/${parts[0]}/docs`] ?? null;
  }

  const sourcePath = path.join(contentDir, parts[0], "docs", ...docParts) + ".mdx";
  const frontmatter = parseFrontmatter(sourcePath);
  if (!frontmatter?.title) return null;

  return {
    title: frontmatter.title,
    description: frontmatter.description || DEFAULT_SITE_DESCRIPTION,
  };
}

function resolveStaticUpdateMetadata(
  route: string,
  contentDir: string,
): { description: string; title: string } | null {
  const parts = normalizeStaticRoute(route).split("/").filter(Boolean);
  if (parts[1] !== "updates" || parts.length < 3) return null;

  const sourcePath = path.join(contentDir, parts[0], "updates", ...parts.slice(2)) + ".mdx";
  const frontmatter = parseFrontmatter(sourcePath);
  if (!frontmatter?.title) return null;
  const suite = STATIC_SUITE_METADATA[getStaticSuiteId(route)];

  return {
    title: frontmatter.title,
    description: `${frontmatter.title} changelog and release notes for ${suite.title}.`,
  };
}

function resolveStaticRegistryMetadata(
  route: string,
  publicDir: string,
): Partial<StaticPageMetadata> | null {
  const parts = normalizeStaticRoute(route).split("/").filter(Boolean);
  if (parts[0] !== "registry") return null;

  if ((parts[1] === "maps" || parts[1] === "mods") && parts[2]) {
    const routeSegment = parts[1];
    const id = decodeURIComponent(parts[2]);
    const manifest = readJsonFile<StaticRegistryManifest>(
      path.join(publicDir, "registry-cache", routeSegment, id, "manifest.json"),
      {},
    );
    if (!manifest.name) return null;
    const title =
      parts[3] === "versions" && parts[4] ? decodeURIComponent(parts[4]) : manifest.name;

    return {
      title,
      description: toPlainTextExcerpt(manifest.description ?? DEFAULT_SITE_DESCRIPTION),
      imagePath:
        resolveRegistryThumbnail(routeSegment, id, manifest.gallery) ??
        STATIC_SUITE_METADATA.registry.imagePath,
    };
  }

  if (parts[1] !== "authors" || !parts[2]) return null;

  const authorsIndex = readJsonFile<{
    authors?: Array<{ author_alias?: string; author_id?: string }>;
  }>(path.join(publicDir, "registry-cache", "authors", "index.json"), {});
  const authorId = decodeURIComponent(parts[2]);
  const author = authorsIndex.authors?.find(
    (entry) => entry.author_id?.toLowerCase() === authorId.toLowerCase(),
  );

  if (parts[3] && !STATIC_REGISTRY_AUTHOR_TABS.includes(parts[3])) {
    const projectName = decodeURIComponent(parts[3]);
    return {
      title: projectName,
      description: `View the Registry statistics, analytics, and listings for ${projectName}.`,
    };
  }

  const authorName = author?.author_alias?.trim() || authorId;
  return {
    title: authorName,
    description: `View the Registry statistics, analytics, and listings for ${authorName}.`,
  };
}

function resolveStaticMetadata(
  route: string,
  contentDir: string,
  publicDir: string,
): StaticPageMetadata {
  const pathname = normalizeStaticRoute(route);
  const suiteId = getStaticSuiteId(pathname);
  const suite = STATIC_SUITE_METADATA[suiteId];
  const staticRegistryMetadata = resolveStaticRegistryMetadata(pathname, publicDir);
  const docsMetadata = resolveStaticDocsMetadata(pathname, contentDir);
  const updateMetadata = resolveStaticUpdateMetadata(pathname, contentDir);
  const navMetadata = STATIC_NAV_METADATA[pathname];
  const baseMetadata: Partial<StaticPageMetadata> | null =
    staticRegistryMetadata ?? docsMetadata ?? updateMetadata ?? navMetadata ?? null;
  const title =
    baseMetadata?.title ??
    (pathname === "/"
      ? DEFAULT_SITE_TITLE
      : suiteId === "general"
        ? DEFAULT_SITE_TITLE
        : suite.title);
  const description = baseMetadata?.description ?? suite.homeDescription;

  return {
    pathname,
    title,
    description,
    suiteId,
    pageTitle: formatStaticPageTitle(title, suiteId),
    imagePath: baseMetadata?.imagePath ?? suite.imagePath,
  };
}

function walkFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = path.join(root, entry.name);
    return entry.isDirectory() ? walkFiles(nextPath) : [nextPath];
  });
}

function extractGithubRepoSlugFromPathParts(parts: string[]): string | null {
  const [owner, repo] = parts;
  if (!owner || !repo) return null;
  return `${owner}/${repo.replace(/\.git$/i, "")}`;
}

function extractGithubRepoSlugFromUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname.endsWith(".github.io")) {
      const owner = hostname.slice(0, -".github.io".length);
      const repo = parsed.pathname
        .split("/")
        .filter(Boolean)[0]
        ?.replace(/\.git$/i, "");
      return owner && repo ? `${owner}/${repo}` : null;
    }

    if (
      hostname !== "github.com" &&
      hostname !== "www.github.com" &&
      hostname !== "raw.githubusercontent.com"
    ) {
      return null;
    }

    return extractGithubRepoSlugFromPathParts(parsed.pathname.split("/").filter(Boolean));
  } catch {
    const matched = trimmed.match(
      /(?:github\.com|raw\.githubusercontent\.com)\/([^/?#]+)\/([^/?#]+)/i,
    );
    return matched
      ? extractGithubRepoSlugFromPathParts([matched[1] ?? "", matched[2] ?? ""])
      : null;
  }
}

function collectContentRoutes(contentDir: string): string[] {
  return walkFiles(contentDir)
    .filter((filePath) => filePath.endsWith(".mdx"))
    .map((filePath) => path.relative(contentDir, filePath).split(path.sep))
    .flatMap((parts) => {
      const [suiteId, section, ...slugParts] = parts;
      if (!suiteId || !section || slugParts.length === 0) return [];

      const slug = slugParts.join("/").replace(/\.mdx$/, "");
      if (section === "docs") {
        const routes = [`/${suiteId}/docs/${slug}`];
        const latestVersion = STATIC_DOCS_LATEST_VERSIONS[suiteId];
        if (latestVersion && slug.startsWith(`${latestVersion}/`)) {
          routes.push(`/${suiteId}/docs/latest/${slug.slice(latestVersion.length + 1)}`);
        }
        return routes;
      }
      if (section === "updates") return [`/${suiteId}/updates/${slug}`];
      return [];
    });
}

function collectLatestDocsHomepageRoutes(): string[] {
  return Object.keys(STATIC_DOCS_LATEST_VERSIONS).map((suiteId) => `/${suiteId}/docs/latest`);
}

function collectRegistryRoutes(publicDir: string): string[] {
  const routes = new Set<string>(["/registry/maps", "/registry/mods"]);
  const projectCounts = new Map<string, number>();

  for (const routeSegment of ["maps", "mods"]) {
    const collectionDir = path.join(publicDir, "registry-cache", routeSegment);
    const indexData = readJsonFile<Record<string, string[]>>(
      path.join(collectionDir, "index.json"),
      {},
    );
    const integrity = readJsonFile<StaticRegistryIntegrity>(
      path.join(collectionDir, "integrity.json"),
      {},
    );
    const ids = indexData[routeSegment] ?? Object.keys(integrity.listings ?? {});

    for (const id of ids) {
      const listing = integrity.listings?.[id];
      const hasCompleteVersion =
        listing?.has_complete_version === true ||
        Object.values(listing?.versions ?? {}).some((version) => version.is_complete === true);
      if (!hasCompleteVersion) continue;

      const manifest = readJsonFile<StaticRegistryManifest>(
        path.join(collectionDir, id, "manifest.json"),
        {},
      );
      if (!manifest.name || manifest.is_test === true) continue;

      routes.add(`/registry/${routeSegment}/${id}`);
      for (const tab of STATIC_REGISTRY_DETAIL_TABS) {
        routes.add(`/registry/${routeSegment}/${id}/${tab}`);
      }

      for (const version of Object.keys(integrity.listings?.[id]?.versions ?? {})) {
        routes.add(`/registry/${routeSegment}/${id}/versions/${version}`);
      }

      const projectId = extractGithubRepoSlugFromUrl(manifest.source);
      if (projectId) {
        projectCounts.set(projectId, (projectCounts.get(projectId) ?? 0) + 1);
      }
    }
  }

  const authorsIndex = readJsonFile<{ authors?: Array<{ author_id?: string }> }>(
    path.join(publicDir, "registry-cache", "authors", "index.json"),
    {},
  );
  for (const author of authorsIndex.authors ?? []) {
    if (!author.author_id) continue;
    routes.add(`/registry/authors/${author.author_id}`);
    for (const tab of STATIC_REGISTRY_AUTHOR_TABS) {
      routes.add(`/registry/authors/${author.author_id}/${tab}`);
    }
  }

  for (const [projectId, count] of projectCounts) {
    if (count <= 1) continue;
    const [authorId, projectName] = projectId.split("/");
    if (!authorId || !projectName) continue;
    routes.add(`/registry/authors/${authorId}/${projectName}`);
    for (const tab of STATIC_REGISTRY_AUTHOR_TABS) {
      routes.add(`/registry/authors/${authorId}/${projectName}/${tab}`);
    }
  }

  return Array.from(routes);
}

function staticEmbedHtmlPlugin(): Plugin {
  const contentDir = path.join(__dirname, "content");
  const publicDir = path.join(__dirname, "public");
  const outDir = path.join(__dirname, "build", "client");

  return {
    name: "static-embed-html",
    async closeBundle() {
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;

      const routes = new Set<string>([
        "/",
        ...Object.keys(STATIC_NAV_METADATA),
        ...collectContentRoutes(contentDir),
        ...collectLatestDocsHomepageRoutes(),
        ...collectRegistryRoutes(publicDir),
      ]);
      const template = fs.readFileSync(indexPath, "utf-8");

      for (const route of routes) {
        const normalizedRoute = normalizeStaticRoute(route);
        const metadata = resolveStaticMetadata(normalizedRoute, contentDir, publicDir);
        const outputPath = getStaticRouteOutputPath(outDir, normalizedRoute);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, applyStaticMetadata(template, metadata));
      }

      fs.writeFileSync(
        path.join(outDir, "404.html"),
        applyStaticMetadata(template, {
          description: DEFAULT_SITE_DESCRIPTION,
          imagePath: STATIC_SUITE_METADATA.general.imagePath,
          pageTitle: DEFAULT_SITE_TITLE,
          pathname: "/404",
        }),
      );
      fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
    },
  };
}

/**
 * Vite plugin that exposes validated raw MDX source and parsed frontmatter
 * through a virtual module for runtime docs tree construction.
 */
function mdxRawContentPlugin(): Plugin {
  const contentDir = path.join(__dirname, "content");
  return {
    name: "mdx-raw-content",
    async buildStart() {
      const { assertDocsContentValid } = await import("./src/config/docs/content-validation.ts");
      const { assertUpdatesContentValid } =
        await import("./src/config/updates/content-validation.ts");
      const { assertRegistryTemplatesContentValid } =
        await import("./src/config/registry/template-content-validation.ts");
      assertDocsContentValid(contentDir);
      assertUpdatesContentValid(contentDir);
      assertRegistryTemplatesContentValid(contentDir);
    },
    configureServer(server) {
      // Re-assemble the virtual module whenever any content file changes so that
      // the dev server picks up new / edited MDX files without a manual restart.
      const watcher = server.watcher;
      watcher.add(contentDir);
      const invalidate = () => {
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_RAW_MDX_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
        }
        server.hot.send({ type: "full-reload" });
      };
      const isContentMarkdownFile = (filePath: string) =>
        filePath.startsWith(contentDir) && /\.(md|mdx)$/i.test(filePath);
      watcher.on("add", (filePath: string) => {
        if (isContentMarkdownFile(filePath)) invalidate();
      });
      watcher.on("change", (filePath: string) => {
        if (isContentMarkdownFile(filePath)) invalidate();
      });
      watcher.on("unlink", (filePath: string) => {
        if (isContentMarkdownFile(filePath)) invalidate();
      });
    },
    resolveId(id) {
      if (id === VIRTUAL_RAW_MDX_ID) return RESOLVED_VIRTUAL_RAW_MDX_ID;
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_RAW_MDX_ID) return;

      const { collectDocsContent } = await import("./src/config/docs/content-validation.ts");
      const { collectUpdatesContent } = await import("./src/config/updates/content-validation.ts");
      const { collectRegistryTemplatesContent } =
        await import("./src/config/registry/template-content-validation.ts");

      const docsResult = collectDocsContent(contentDir);
      const updatesResult = collectUpdatesContent(contentDir);
      const templatesResult = collectRegistryTemplatesContent(contentDir);
      const errors = [...docsResult.errors, ...updatesResult.errors, ...templatesResult.errors];
      if (errors.length > 0) {
        const details = errors.map((e) => ` - ${e}`).join("\n");
        throw new Error(`[docs-content] Validation failed:\n${details}`);
      }

      const rawByPath = {
        ...docsResult.rawByPath,
        ...updatesResult.rawByPath,
        ...templatesResult.rawByPath,
      };
      const frontmatterByPath = {
        ...docsResult.frontmatterByPath,
        ...updatesResult.frontmatterByPath,
        ...templatesResult.frontmatterByPath,
      };

      return `export default ${JSON.stringify({ rawByPath, frontmatterByPath })};`;
    },
  };
}

/**
 * Escapes static heading ID braces `{#some-id}` so MDX's expression parser
 * does not try to evaluate them as JSX expressions. The HTML entities are
 * decoded back into `{#some-id}` text by remark/micromark, which is then
 * picked up by the `remarkHeadingIds` plugin to set the explicit heading id.
 */
const HEADING_ID_RE = /^(#{2,4}\s+.+?)\s+\{#([A-Za-z0-9._-]+)\}\s*$/gm;

function escapeHeadingIds(code: string): string {
  if (!code.includes("{#")) return code;
  return code.replace(
    HEADING_ID_RE,
    (_full, head: string, id: string) => `${head} &#x7B;#${id}&#x7D;`,
  );
}

/**
 * Wraps the @mdx-js/rollup plugin to escape `{#id}` from headings before MDX
 * parsing, so the explicit ID survives parsing as text and remarkHeadingIds
 * can extract it onto the rendered heading element.
 */
function mdxHeadingIdEscapePlugin(): Plugin {
  return {
    name: "mdx-heading-id-escape",
    load(id) {
      if (typeof id !== "string" || !id.endsWith(".mdx")) return;
      if (id.startsWith("\0")) return;
      try {
        const content = fs.readFileSync(id, "utf-8");
        return escapeHeadingIds(content);
      } catch {
        return;
      }
    },
  };
}

function toPluginList(plugin: unknown): Plugin[] {
  if (Array.isArray(plugin)) return plugin as Plugin[];
  return [plugin as Plugin];
}

export default defineConfig(async () => {
  // Keep dynamic imports for TypeScript resolution stability when vp lint
  // loads this config through Node's synchronous ESM linker.
  const { remarkHeadingIds, remarkStripFrontmatter, remarkAdmonitionDirectives } =
    await import("@subway-builder-modded/mdx/remark");

  return {
    build: {
      outDir: "build/client",
    },
    lint: {
      ignorePatterns: ["node_modules/**", "build/**", "coverage/**", "dist/**"],
      // tsgolint currently fails on this Windows workspace path; keep linting stable
      // and run TypeScript checks via a dedicated `pnpm run typecheck` script.
      options: {
        typeAware: false,
        typeCheck: false,
      },
    },
    fmt: {
      ignorePatterns: ["node_modules/**", "build/**", "coverage/**"],
    },
    plugins: [
      staticEmbedHtmlPlugin(),
      mdxRawContentPlugin(),
      mdxHeadingIdEscapePlugin(),
      ...toPluginList(tailwindcss()),
      ...toPluginList(
        mdx({
          remarkPlugins: [
            remarkFrontmatter,
            remarkStripFrontmatter,
            remarkHeadingIds,
            remarkGfm,
            remarkDirective,
            remarkAdmonitionDirectives,
          ],
          rehypePlugins: [
            [
              rehypePrettyCode,
              {
                theme: {
                  dark: "github-dark",
                  light: "github-light-high-contrast",
                },
                keepBackground: false,
              },
            ],
          ],
        }),
      ),
    ],
    resolve: {
      alias: [
        { find: "@", replacement: path.resolve(__dirname, "./src") },
        {
          find: /^@subway-builder-modded\/(.+)$/,
          replacement: path.resolve(__dirname, "../packages/$1/src/index.ts"),
        },
      ],
    },
    optimizeDeps: {
      exclude: [
        "@subway-builder-modded/analytics",
        "@subway-builder-modded/shared-ui",
        "@subway-builder-modded/asset-listings-ui",
        "@subway-builder-modded/stores-core",
        "@subway-builder-modded/asset-listings-state",
        "@subway-builder-modded/lifecycle-core",
        "@subway-builder-modded/lifecycle-web",
        "@subway-builder-modded/config",
      ],
    },
  };
});
