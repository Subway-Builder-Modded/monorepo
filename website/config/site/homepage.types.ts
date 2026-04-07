import type { LucideIcon } from 'lucide-react';
import type { AppIconValue } from '@/lib/icons';
import type { ProjectColorId } from '@/config/theme/contracts';

export type HomeButtonScheme = 'default' | ProjectColorId;
export type HomeButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type HomeLink = {
  label: string;
  href: string;
  external?: boolean;
  icon?: AppIconValue;
  variant: 'solid' | 'outline';
  scheme?: HomeButtonScheme;
  size: HomeButtonSize;
};

export type HomeProjectCard = {
  id: string;
  title: string;
  description: string;
  scheme: ProjectColorId;
  icon: LucideIcon;
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  buttons: HomeLink[];
};
