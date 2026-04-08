export const REGISTRY_OWNER = 'Subway-Builder-Modded';
export const PRIMARY_REGISTRY_REPO = 'registry';
export const LEGACY_REGISTRY_REPO = 'The-Railyard';

const RAW_REGISTRY_BASES = [
  `https://raw.githubusercontent.com/${REGISTRY_OWNER}/${PRIMARY_REGISTRY_REPO}/main`,
  `https://raw.githubusercontent.com/${REGISTRY_OWNER}/${LEGACY_REGISTRY_REPO}/main`,
] as const;

const RAW_REGISTRY_REF_BASES = [
  `https://raw.githubusercontent.com/${REGISTRY_OWNER}/${PRIMARY_REGISTRY_REPO}/refs/heads/main`,
  `https://raw.githubusercontent.com/${REGISTRY_OWNER}/${LEGACY_REGISTRY_REPO}/refs/heads/main`,
] as const;

const CDN_REGISTRY_BASES = [
  `https://cdn.jsdelivr.net/gh/${REGISTRY_OWNER}/${PRIMARY_REGISTRY_REPO}@main`,
  `https://cdn.jsdelivr.net/gh/${REGISTRY_OWNER}/${LEGACY_REGISTRY_REPO}@main`,
] as const;

function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, '');
}

export function getRawRegistryUrls(path: string): string[] {
  const normalizedPath = trimLeadingSlash(path);
  return RAW_REGISTRY_BASES.map((base) => `${base}/${normalizedPath}`);
}

export function getRawRegistryRefUrls(path: string): string[] {
  const normalizedPath = trimLeadingSlash(path);
  return RAW_REGISTRY_REF_BASES.map((base) => `${base}/${normalizedPath}`);
}

export function getRegistryCdnUrls(path: string): string[] {
  const normalizedPath = trimLeadingSlash(path);
  return CDN_REGISTRY_BASES.map((base) => `${base}/${normalizedPath}`);
}

export async function fetchRegistryJsonWithFallback<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const candidates = getRawRegistryUrls(path);
  let lastError: unknown = new Error(
    `Failed to fetch registry JSON for ${path}`,
  );

  for (const url of candidates) {
    try {
      const response = await fetch(url, init);
      if (response.ok) {
        return (await response.json()) as T;
      }
      lastError = new Error(
        `${response.status} ${response.statusText} for ${url}`,
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
