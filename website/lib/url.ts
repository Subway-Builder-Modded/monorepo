export { WORKSPACE_NAME } from '@subway-builder-modded/config';

export function isExternalHref(href?: string | null): boolean {
  return Boolean(href?.startsWith('http://') || href?.startsWith('https://'));
}

export function normalizePath(path: string): string {
  if (path === '/') return path;
  return path.replace(/\/+$/, '');
}
