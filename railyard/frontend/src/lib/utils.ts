export { type ClassValue, cn } from '@subway-builder-modded/shared-ui';

/** Join OS path segments, stripping redundant separators (handles both / and \). */
export function joinOsPath(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((part, index) => {
      if (index === 0) return part.replace(/[\\/]+$/, '');
      return part.replace(/^[\\/]+|[\\/]+$/g, '');
    })
    .join('/');
}
