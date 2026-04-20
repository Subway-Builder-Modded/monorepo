import { useEffect, useMemo, useRef, useState } from "react";
import {
  NavRow,
  PageHeading,
  SITE_SHELL_CLASS,
  SuiteAccentScope,
  SuiteStatusChip,
} from "@subway-builder-modded/shared-ui";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { getSuiteById } from "@/app/config/site-navigation";
import {
  getDocsSuiteConfig,
  getDocsVersion,
  getVisibleVersions,
  isVersionedDocsSuite,
} from "@/app/config/docs";
import type { DocsSuiteId } from "@/app/config/docs";
import { getDocsTree, getVisibleNodes } from "@/app/features/docs/lib/content";
import { getDocPageUrl, getDocsHomepageUrl } from "@/app/features/docs/lib/routing";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { AlertTriangle, ChevronDown } from "lucide-react";

function DeprecatedBanner({ version }: { version: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-medium text-amber-600 dark:text-amber-400">
          You are viewing docs for <strong>{version}</strong>, which is deprecated.
        </p>
        <p className="mt-1 text-muted-foreground">
          Consider switching to the latest version for up-to-date information.
        </p>
      </div>
    </div>
  );
}

function VersionDropdown({
  suiteId,
  currentVersion,
}: {
  suiteId: DocsSuiteId;
  currentVersion: string;
}) {
  const versions = getVisibleVersions(suiteId);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (versions.length <= 1) {
    return null;
  }

  const selected = versions.find((item) => item.value === currentVersion) ?? versions[0];
  const isDeprecatedSelected = selected.status === "deprecated";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-9 min-w-[12rem] items-center justify-between gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDeprecatedSelected
            ? "border-border/70 bg-muted/35 text-muted-foreground hover:bg-muted/50"
            : "border-[color-mix(in_srgb,var(--suite-accent-light)_35%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] text-[var(--suite-accent-light)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_16%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_20%,transparent)]",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choose documentation version"
      >
        <span className="inline-flex items-center gap-2">
          <span>{selected.label}</span>
          {selected.status === "latest" ? <SuiteStatusChip status="latest" size="sm" /> : null}
          {selected.status === "deprecated" ? (
            <SuiteStatusChip status="deprecated" deprecatedTone="gray" size="sm" />
          ) : null}
        </span>
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Documentation versions"
          className="absolute right-0 z-30 mt-2 w-full min-w-[13rem] rounded-xl border border-border/70 bg-background p-1 shadow-lg"
        >
          {versions.map((item) => {
            const selectedItem = item.value === currentVersion;
            const isDeprecated = item.status === "deprecated";
            return (
              <li key={item.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedItem}
                  onClick={() => {
                    const url = getDocsHomepageUrl(suiteId, item.value);
                    setOpen(false);
                    window.history.pushState({}, "", url);
                    window.dispatchEvent(new Event("sbm:navigate"));
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    isDeprecated
                      ? "text-muted-foreground hover:bg-muted/50"
                      : "text-[var(--suite-accent-light)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)]",
                    selectedItem &&
                      (isDeprecated
                        ? "bg-muted/45"
                        : "bg-[color-mix(in_srgb,var(--suite-accent-light)_16%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_20%,transparent)]"),
                  )}
                >
                  <span>{item.label}</span>
                  {item.status === "latest" ? <SuiteStatusChip status="latest" size="sm" /> : null}
                  {item.status === "deprecated" ? (
                    <SuiteStatusChip status="deprecated" deprecatedTone="gray" size="sm" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function Signboard({
  suiteId,
  version,
}: {
  suiteId: DocsSuiteId;
  version: string | null;
}) {
  const suite = getSuiteById(suiteId);
  const config = getDocsSuiteConfig(suiteId)!;
  const isVersioned = isVersionedDocsSuite(suiteId);
  const versionConfig = version ? getDocsVersion(suiteId, version) : null;
  const SuiteIcon = suite.icon;

  return (
    <PageHeading
      icon={SuiteIcon}
      title={config.homepage.heroTitle ?? `${suite.title} Documentation`}
      description={config.homepage.description}
      eyebrow="Documentation"
      accent={suite.accent}
      badge={
        isVersioned && versionConfig ? (
          versionConfig.status === "deprecated" ? (
            <SuiteStatusChip status="deprecated" deprecatedTone="gray" />
          ) : versionConfig.status === "latest" ? (
            <SuiteStatusChip status="latest" />
          ) : null
        ) : undefined
      }
      actions={
        isVersioned && version ? <VersionDropdown suiteId={suiteId} currentVersion={version} /> : undefined
      }
    />
  );
}

function DocsCardGrid({
  suiteId,
  version,
}: {
  suiteId: DocsSuiteId;
  version: string | null;
}) {
  const tree = getDocsTree(suiteId, version);
  const visibleNodes = useMemo(() => getVisibleNodes(tree.nodes), [tree]);

  if (visibleNodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No documentation pages found for this version.
      </p>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {visibleNodes.map((node) => {
        const Icon = resolveIcon(node.frontmatter.icon);

        return (
          <Link
            key={node.slug}
            to={getDocPageUrl(suiteId, version, node.slug)}
            className={cn(
              "group block rounded-xl border-2 border-border/60 bg-background/70 p-2 transition-all",
              "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_7%,transparent)]",
              "dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_35%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_10%,transparent)]",
            )}
            style={{
              ["--nav-accent" as string]: "var(--suite-accent-light)",
              ["--nav-muted" as string]: "color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)",
            }}
          >
            <NavRow
              title={node.frontmatter.title}
              description={node.frontmatter.description}
              icon={<Icon className="size-5" aria-hidden={true} />}
              className="rounded-[0.7rem]"
            />
          </Link>
        );
      })}
    </div>
  );
}

export function DocsHomepage({
  suiteId,
  version,
}: {
  suiteId: DocsSuiteId;
  version: string | null;
}) {
  const versionConfig = version ? getDocsVersion(suiteId, version) : null;
  const isDeprecated = versionConfig?.status === "deprecated";
  const suite = getSuiteById(suiteId);

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-6 lg:py-8">
        <div className={SITE_SHELL_CLASS}>
          {isDeprecated && version ? <DeprecatedBanner version={version} /> : null}
          <Signboard suiteId={suiteId} version={version} />
        </div>

        <div className={cn(SITE_SHELL_CLASS, "mt-2")}>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Start Here
          </h2>
          <DocsCardGrid suiteId={suiteId} version={version} />
        </div>
      </section>
    </SuiteAccentScope>
  );
}
