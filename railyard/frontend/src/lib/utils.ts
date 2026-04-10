import {
  type ClassValue as SharedClassValue,
  cn as sharedCn,
} from '@subway-builder-modded/shared-ui';

export type ClassValue = SharedClassValue;

export function cn(...inputs: ClassValue[]) {
  return sharedCn(...inputs);
}

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
