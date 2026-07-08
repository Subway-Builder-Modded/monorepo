import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Download, Loader2 } from "lucide-react";
import { ScrollArea, StaticTableHead } from "@subway-builder-modded/shared-ui";
import { Link } from "@/lib/router";
import { articleMdxComponents } from "@/features/content/mdx";
import { MdxRenderedHtml } from "@/features/content/mdx/rendered-html";
import {
  evaluatePlaygroundMdx,
  renderPlaygroundHtml,
} from "@/features/markdown-playground/lib/mdx-runtime";
import { formatRegistryDate } from "@/features/registry/detail/lib/format-registry-date";
import { getRegistryDetailUrl, getRegistryVersionUrl } from "@/features/registry/lib/routing";
import type { RegistryDetailVersion } from "@/features/registry/detail/registry-detail-types";

type VersionsTabProps = {
  versions: RegistryDetailVersion[];
  routeSegment: string;
  listingId: string;
  versionSource?: {
    updateType: string | null;
    updateUrl: string | null;
  } | null;
  selectedVersionId?: string;
};

type VersionChangelogComponent = ComponentType<{
  components?: Record<string, ComponentType<any>>;
}>;
type VersionChangelogRenderState =
  | { kind: "component"; Component: VersionChangelogComponent }
  | { kind: "html"; html: string };

const numberFormatter = new Intl.NumberFormat("en-US");
const changelogCache = new Map<string, Promise<string | null>>();

function encodeRepoSlug(repoSlug: string): string {
  return repoSlug
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

async function getGitHubReleaseChangelog(repo: string, tag: string): Promise<string | null> {
  const cacheKey = `${repo}#${tag}`;
  const existing = changelogCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    const response = await fetch(
      `https://api.github.com/repos/${encodeRepoSlug(repo)}/releases/tags/${encodeURIComponent(tag)}`,
    );
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { body?: unknown };
    const body = typeof payload.body === "string" ? payload.body.trim() : "";
    return body || null;
  })();

  changelogCache.set(cacheKey, request);
  return request;
}

function normalizeVersionKey(version: string): string {
  return version.trim().replace(/^v/i, "").toLowerCase();
}

async function getCustomVersionChangelog(
  updateUrl: string,
  versionId: string,
): Promise<string | null> {
  const cacheKey = `custom:${updateUrl}#${versionId}`;
  const existing = changelogCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    const response = await fetch(updateUrl);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as unknown;
    const rawVersions = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { versions?: unknown[] })?.versions)
        ? (payload as { versions: unknown[] }).versions
        : [];

    const matchingVersion = rawVersions.find((entry) => {
      const value = (entry ?? {}) as { version?: unknown };
      return (
        typeof value.version === "string" &&
        normalizeVersionKey(value.version) === normalizeVersionKey(versionId)
      );
    }) as { changelog?: unknown } | undefined;

    const changelog =
      typeof matchingVersion?.changelog === "string" ? matchingVersion.changelog.trim() : "";
    return changelog || null;
  })();

  changelogCache.set(cacheKey, request);
  return request;
}

async function renderVersionChangelog(markdown: string): Promise<VersionChangelogRenderState> {
  try {
    const Component = await evaluatePlaygroundMdx(markdown);
    return { kind: "component", Component };
  } catch {
    const { html } = await renderPlaygroundHtml(markdown);
    return { kind: "html", html };
  }
}

function formatDownloads(value: number | null): string {
  if (value === null || value === undefined) {
    return "\u2014";
  }
  return numberFormatter.format(value);
}

export function VersionsTab({
  versions,
  routeSegment,
  listingId,
  versionSource,
  selectedVersionId,
}: VersionsTabProps) {
  const [versionChangelog, setVersionChangelog] = useState<VersionChangelogRenderState | null>(
    null,
  );
  const [isChangelogLoading, setIsChangelogLoading] = useState(false);
  const [changelogError, setChangelogError] = useState<string | null>(null);
  const selectedVersion = useMemo(
    () =>
      selectedVersionId
        ? (versions.find((version) => version.version === selectedVersionId) ?? null)
        : null,
    [versions, selectedVersionId],
  );
  const versionChangelogContent = useMemo(() => {
    if (versionChangelog?.kind === "component") {
      const Changelog = versionChangelog.Component;
      return (
        <div className="max-w-none text-sm leading-7 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          <Changelog components={articleMdxComponents} />
        </div>
      );
    }

    if (versionChangelog?.kind === "html") {
      return <MdxRenderedHtml html={versionChangelog.html} />;
    }

    return null;
  }, [versionChangelog]);

  // Load changelog markdown for selected version from the version source.
  // GitHub-backed items use release notes, while custom maps read from their update JSON.
  useEffect(() => {
    let cancelled = false;

    if (!selectedVersion) {
      setVersionChangelog(null);
      setChangelogError(null);
      setIsChangelogLoading(false);
      return;
    }

    const sourceRepo = selectedVersion.sourceRepo?.trim() ?? "";
    const sourceTag = selectedVersion.sourceTag?.trim() ?? "";
    const updateType = versionSource?.updateType?.trim() ?? "";
    const updateUrl = versionSource?.updateUrl?.trim() ?? "";

    if (updateType === "custom" && updateUrl) {
      setIsChangelogLoading(true);
      setChangelogError(null);
      setVersionChangelog(null);

      void getCustomVersionChangelog(updateUrl, selectedVersion.version)
        .then(async (markdown) => {
          if (cancelled) {
            return;
          }

          if (!markdown) {
            setVersionChangelog(null);
            return;
          }

          const changelog = await renderVersionChangelog(markdown);
          if (!cancelled) {
            setVersionChangelog(changelog);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setChangelogError("Unable to load changelog for this version right now.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsChangelogLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    if (!sourceRepo || !sourceTag) {
      setVersionChangelog(null);
      setChangelogError(null);
      setIsChangelogLoading(false);
      return;
    }

    setIsChangelogLoading(true);
    setChangelogError(null);
    setVersionChangelog(null);

    void getGitHubReleaseChangelog(sourceRepo, sourceTag)
      .then(async (markdown) => {
        if (cancelled) {
          return;
        }

        if (!markdown) {
          setVersionChangelog(null);
          return;
        }

        const changelog = await renderVersionChangelog(markdown);
        if (!cancelled) {
          setVersionChangelog(changelog);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChangelogError("Unable to load changelog for this version right now.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsChangelogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVersion, versionSource]);

  if (versions.length === 0) {
    return <p className="text-sm text-muted-foreground">No published versions are available.</p>;
  }

  if (selectedVersionId) {
    return (
      <div className="space-y-4">
        <nav className="text-sm text-muted-foreground">
          <Link
            to={getRegistryDetailUrl(routeSegment, listingId, "versions")}
            preserveScroll={true}
            className="transition-colors hover:text-foreground"
          >
            Versions
          </Link>
          <span className="px-2">&gt;</span>
          <span className="font-medium text-foreground">{selectedVersionId}</span>
        </nav>

        {!selectedVersion ? (
          <p className="text-sm text-muted-foreground">This version could not be found.</p>
        ) : (
          <section className="rounded-lg border border-border/60 bg-background/70 p-4">
            <header className="mb-4 flex items-center justify-between border-b border-border/45 pb-3">
              <h3 className="text-base font-semibold text-foreground">Release Notes</h3>
              {selectedVersion.downloadUrl ? (
                <a
                  href={selectedVersion.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-[var(--registry-type-accent)]"
                >
                  <Download className="size-4" />
                </a>
              ) : (
                <span className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground/45">
                  <Download className="size-4" />
                </span>
              )}
            </header>

            {isChangelogLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading changelog...
              </div>
            ) : changelogError ? (
              <p className="text-sm text-muted-foreground">{changelogError}</p>
            ) : versionChangelogContent ? (
              versionChangelogContent
            ) : (
              <p className="text-sm text-muted-foreground">
                No changelog provided for this version.
              </p>
            )}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="mdx-table-wrap my-1 overflow-hidden rounded-lg border border-border/50">
      <ScrollArea scrollbars="horizontal" className="w-full">
        <div className="min-w-[44rem] xl:min-w-0">
          <table className="w-full table-fixed text-sm">
            <thead className="border-b border-border/50 bg-muted/30">
              <tr>
                <StaticTableHead label="Version" />
                <StaticTableHead label="Release Date" />
                <StaticTableHead label="Downloads" />
                <th className="w-14 align-middle px-0 py-2.5 text-center font-semibold text-muted-foreground" />
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.version} className="hover:bg-muted/20">
                  <td className="border-t border-border/30 px-4 py-2.5 font-medium text-foreground">
                    <Link
                      to={getRegistryVersionUrl(routeSegment, listingId, version.version)}
                      preserveScroll={true}
                      className="transition-colors hover:text-[var(--registry-type-accent)]"
                    >
                      {version.version}
                    </Link>
                  </td>
                  <td className="border-t border-border/30 px-4 py-2.5 text-foreground/85">
                    {formatRegistryDate(version.releaseDate)}
                  </td>
                  <td className="border-t border-border/30 px-4 py-2.5 text-left text-foreground/85 tabular-nums">
                    {formatDownloads(version.downloads)}
                  </td>
                  <td className="border-t border-border/30 px-0 py-2.5 text-center">
                    <div className="flex h-full min-h-9 w-full items-center justify-center border-l-2 border-border/70">
                      {version.downloadUrl ? (
                        <a
                          href={version.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-[var(--registry-type-accent)]"
                        >
                          <Download className="size-4" />
                        </a>
                      ) : (
                        <span className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground/45">
                          <Download className="size-4" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
