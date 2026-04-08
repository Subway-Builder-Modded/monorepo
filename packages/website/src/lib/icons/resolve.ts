import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  APP_ICON_ALIASES,
  APP_ICON_REGISTRY,
  type AppIconRegistryName,
} from '@/lib/icons/registry';
import type {
  AppIconDefinition,
  AppIconInput,
  AssetIconDefinition,
} from '@/lib/icons/types';

const NODE_ENV = process.env.NODE_ENV;

function isIconObject(value: unknown): value is AssetIconDefinition {
  return typeof value === 'object' && value !== null && 'type' in value;
}

export function isMaskIcon(
  icon: AppIconDefinition,
): icon is Extract<AppIconDefinition, { type: 'mask' }> {
  return isIconObject(icon) && icon.type === 'mask';
}

export function isImageIcon(
  icon: AppIconDefinition,
): icon is Extract<AppIconDefinition, { type: 'image' }> {
  return isIconObject(icon) && icon.type === 'image';
}

export function isLucideIcon(icon: AppIconDefinition): icon is LucideIcon {
  return (
    typeof icon === 'function' || (typeof icon === 'object' && icon !== null)
  );
}

function normalizeIconToken(value: string) {
  return value
    .trim()
    .replace(/[\s_-]+/g, '-')
    .toLowerCase();
}

function toPascalCase(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  return trimmed
    .replace(/[_\s-]+/g, ' ')
    .split(' ')
    .map((segment) =>
      segment ? `${segment[0].toUpperCase()}${segment.slice(1)}` : '',
    )
    .join('');
}

function normalizeRegistryAliasKey(value: string) {
  return normalizeIconToken(value).replace(/-/g, '');
}

const NORMALIZED_ICON_ALIASES: Record<string, AppIconRegistryName> =
  Object.entries(APP_ICON_ALIASES).reduce<Record<string, AppIconRegistryName>>(
    (out, [alias, registryName]) => {
      out[normalizeIconToken(alias)] = registryName;
      out[normalizeRegistryAliasKey(alias)] = registryName;
      return out;
    },
    {},
  );

for (const registryName of Object.keys(
  APP_ICON_REGISTRY,
) as AppIconRegistryName[]) {
  NORMALIZED_ICON_ALIASES[normalizeIconToken(registryName)] = registryName;
  NORMALIZED_ICON_ALIASES[normalizeRegistryAliasKey(registryName)] =
    registryName;
}

function resolveRegistryName(value: string): AppIconRegistryName | undefined {
  const normalized = value.trim();
  if (!normalized) return undefined;

  if (normalized in APP_ICON_REGISTRY) {
    return normalized as AppIconRegistryName;
  }

  const tokenKey = normalizeIconToken(normalized);
  const compactKey = normalizeRegistryAliasKey(normalized);
  return (
    NORMALIZED_ICON_ALIASES[tokenKey] ?? NORMALIZED_ICON_ALIASES[compactKey]
  );
}

const LUCIDE_ICON_BY_NAME = Object.entries(LucideIcons).reduce<
  Record<string, LucideIcon>
>((out, [name, icon]) => {
  if (
    (/^[A-Z]/.test(name) || name.endsWith('Icon')) &&
    (typeof icon === 'function' || (typeof icon === 'object' && icon !== null))
  ) {
    out[name] = icon as LucideIcon;
  }
  return out;
}, {});

const LUCIDE_ICON_BY_LOWER_NAME = Object.entries(LUCIDE_ICON_BY_NAME).reduce<
  Record<string, LucideIcon>
>((out, [name, icon]) => {
  out[name.toLowerCase()] = icon;
  return out;
}, {});

export function resolveNamedLucideIcon(value: string): LucideIcon | undefined {
  const normalized = value.trim();
  if (!normalized) return undefined;

  const pascalName = toPascalCase(normalized);
  const exactCandidate = LUCIDE_ICON_BY_NAME[normalized];
  const pascalCandidate =
    LUCIDE_ICON_BY_NAME[pascalName] ?? LUCIDE_ICON_BY_NAME[`${pascalName}Icon`];

  if (exactCandidate) return exactCandidate;
  if (pascalCandidate) return pascalCandidate;

  return (
    LUCIDE_ICON_BY_LOWER_NAME[normalized.toLowerCase()] ??
    LUCIDE_ICON_BY_LOWER_NAME[`${pascalName.toLowerCase()}icon`]
  );
}

export function assertKnownIconName(value: string): never {
  throw new Error(
    `[icons] Unknown icon "${value}". Use a registry key/alias or a valid Lucide icon name.`,
  );
}

export function resolveAppIcon(icon: AppIconInput): AppIconDefinition | null {
  if (!icon) return null;

  if (typeof icon === 'string') {
    const registryName = resolveRegistryName(icon);
    if (registryName) return APP_ICON_REGISTRY[registryName];

    const lucideIcon = resolveNamedLucideIcon(icon);
    if (lucideIcon) return lucideIcon;

    if (NODE_ENV === 'development' && icon.trim()) {
      assertKnownIconName(icon);
    }
    return null;
  }

  return icon;
}
