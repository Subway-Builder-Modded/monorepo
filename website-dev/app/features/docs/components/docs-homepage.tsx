import { useMemo } from "react";
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
import { getDocsSuiteConfig, getDocsVersion, isVersionedDocsSuite } from "@/app/config/docs";
import type { DocsSuiteId } from "@/app/config/docs";
import { getDocsTree, getVisibleNodes } from "@/app/features/docs/lib/content";
import { getDocPageUrl } from "@/app/features/docs/lib/routing";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { DocsVersionChooser } from "./docs-version-chooser";
import { DocsDeprecatedNotice } from "./docs-deprecated-notice";

function Signboard({ suiteId, version }: { suiteId: DocsSuiteId; version: string | null }) {
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
        isVersioned && version ? (
          <DocsVersionChooser suiteId={suiteId} currentVersion={version} />
        ) : undefined
      }
    />
  );
}

function DocsCardGrid({ suiteId, version }: { suiteId: DocsSuiteId; version: string | null }) {
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
              ["--nav-muted" as string]:
                "color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)",
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
          {isDeprecated && version ? (
            <DocsDeprecatedNotice version={version} context="homepage" />
          ) : null}
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
