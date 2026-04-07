import type { LucideIcon } from 'lucide-react';

export type MaskIconDefinition = {
  type: 'mask';
  src: string;
};

export type ImageIconDefinition = {
  type: 'image';
  src: string;
};

export type AssetIconDefinition = MaskIconDefinition | ImageIconDefinition;

export type AppIconDefinition = LucideIcon | AssetIconDefinition;

export type AppIconInput = AppIconDefinition | string | null | undefined;

export type AppIconValue = NonNullable<AppIconInput>;
