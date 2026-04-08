import {
  DOCS_INSTANCES,
  getDocsInstanceById,
  type DocsInstance,
  type DocsVersion,
} from '@/config/content/docs';

export type DocsSidebarPage = {
  kind: 'page';
  key: string;
  title: string;
  href: string;
};

export type DocsSidebarCategory = {
  kind: 'category';
  key: string;
  title: string;
  href?: string;
  items: DocsSidebarEntry[];
};

export type DocsSidebarEntry = DocsSidebarPage | DocsSidebarCategory;

export type DocsSidebarTree = {
  entries: DocsSidebarEntry[];
};

export type ResolvedDocsRoute = {
  instance: DocsInstance;
  version: string | null;
  docSlug: string | null;
  requestedVersion: string | null;
};

export function isLatestVersion(instance: DocsInstance, versionValue: string) {
  return !!instance.latestVersion && instance.latestVersion === versionValue;
}

export function buildDocsHubHref(instance: DocsInstance) {
  return instance.basePath;
}

export function resolveDocsRoute(slug?: string[]): ResolvedDocsRoute | null {
  const parts = slug ?? [];
  const [instanceId, maybeVersion, ...rest] = parts;

  return resolveDocsRouteForInstance(
    instanceId,
    [maybeVersion, ...rest].filter(Boolean),
  );
}

export function resolveDocsRouteForInstance(
  instanceId: string | undefined,
  slug?: string[],
): ResolvedDocsRoute | null {
  const parts = slug ?? [];
  const [maybeVersion, ...rest] = parts;

  if (!instanceId) return null;

  const instance = getDocsInstanceById(instanceId);
  if (!instance) return null;

  if (!instance.versioned) {
    return {
      instance,
      version: null,
      docSlug: [maybeVersion, ...rest].filter(Boolean).join('/') || null,
      requestedVersion: null,
    };
  }

  const requestedVersion = maybeVersion ?? null;
  const normalizedVersion =
    requestedVersion === 'latest'
      ? (instance.latestVersion ?? null)
      : requestedVersion;

  const versionValues = new Set(instance.versions?.map((v) => v.value) ?? []);
  const hasExplicitVersion =
    !!normalizedVersion && versionValues.has(normalizedVersion);

  return {
    instance,
    version: hasExplicitVersion
      ? normalizedVersion
      : (instance.latestVersion ?? null),
    docSlug: hasExplicitVersion
      ? rest.join('/') || null
      : [maybeVersion, ...rest].filter(Boolean).join('/') || null,
    requestedVersion,
  };
}

export function getActiveInstanceFromPathname(pathname: string) {
  return (
    DOCS_INSTANCES.find(
      (instance) =>
        pathname === instance.basePath ||
        pathname.startsWith(`${instance.basePath}/`),
    ) ?? DOCS_INSTANCES[0]
  );
}

export function getActiveVersionFromPathname(
  instance: DocsInstance,
  pathname: string,
): DocsVersion | null {
  if (!instance.versioned || !instance.versions?.length) return null;

  const afterBase = pathname.slice(instance.basePath.length);
  const parts = afterBase.split('/').filter(Boolean);
  const maybeVersion = parts[0];

  return (
    instance.versions.find((version) => version.value === maybeVersion) ??
    instance.versions.find(
      (version) => version.value === instance.latestVersion,
    ) ??
    instance.versions[0]
  );
}

export function buildDocHref(
  instance: DocsInstance,
  version: string | null,
  docPath: string,
) {
  if (instance.versioned && version) {
    return `${instance.basePath}/${version}/${docPath}`;
  }

  return `${instance.basePath}/${docPath}`;
}

export function getDocSlugFromPathname(
  instance: DocsInstance,
  pathname: string,
): string | null {
  if (!pathname.startsWith(instance.basePath)) return null;

  const afterBase = pathname.slice(instance.basePath.length);
  const parts = afterBase.split('/').filter(Boolean);

  if (!instance.versioned) {
    return parts.join('/') || null;
  }

  const versionValues = new Set(instance.versions?.map((v) => v.value) ?? []);
  const maybeVersion = parts[0];
  const hasExplicitVersion = !!maybeVersion && versionValues.has(maybeVersion);

  const docParts = hasExplicitVersion ? parts.slice(1) : parts;
  return docParts.join('/') || null;
}

export function buildVersionedDocHref(
  instance: DocsInstance,
  versionValue: string,
  pathname: string,
) {
  const docSlug = getDocSlugFromPathname(instance, pathname);

  if (!instance.versioned) {
    return docSlug
      ? buildDocHref(instance, null, docSlug)
      : buildDocsHubHref(instance);
  }

  return docSlug
    ? buildDocHref(instance, versionValue, docSlug)
    : buildDocsHubHref(instance);
}
