import { WORKSPACE_NAME as CONFIG_WORKSPACE_NAME } from '@subway-builder-modded/config';

export const WORKSPACE_NAME = CONFIG_WORKSPACE_NAME;

export function isExternalHref(href?: string | null): boolean {
  return Boolean(href?.startsWith('http://') || href?.startsWith('https://'));
}

export function normalizePath(path: string): string {
  if (path === '/') return path;
  return path.replace(/\/+$/, '');
}
