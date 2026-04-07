import type { LucideIcon } from 'lucide-react';

export type DocsInstanceId = 'railyard' | 'template-mod';

export type DocsSidebarOrderItem =
  | string
  | {
      key: string;
      children?: DocsSidebarOrderItem[];
    };

export type DocsVersion = {
  value: string;
  label: string;
  icon?: LucideIcon;
  // When true, the version switcher shows a "Deprecated" badge.
  deprecated?: boolean;
  sidebarOrder?: DocsSidebarOrderItem[];
};

export type DocsInstance = {
  id: DocsInstanceId;
  label: string;
  basePath: string;
  icon: LucideIcon;
  sidebarHeader?: {
    icon: LucideIcon;
  };
  versioned: boolean;
  latestVersion?: string;
  versions?: DocsVersion[];
  sidebarOrder?: DocsSidebarOrderItem[];
  hub: {
    description: string;
    cards: {
      title: string;
      description: string;
      icon: LucideIcon;
      docPath: string;
    }[];
  };
};
