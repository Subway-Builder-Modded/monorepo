export type NavIconKey =
  | 'logo'
  | 'railyard'
  | 'registry'
  | 'template-mod'
  | 'website'
  | 'tools'
  | 'community'
  | 'discord'
  | 'github'
  | 'theme'
  | 'browse'
  | 'library'
  | 'profiles'
  | 'logs'
  | 'settings'
  | 'launch'
  | 'stop'
  | 'refresh'
  | 'download'
  | 'analytics'
  | 'world-map'
  | 'docs'
  | 'updates'
  | 'trending'
  | 'playground'
  | 'credits'
  | 'license'
  | 'contribute'
  | 'theme-light'
  | 'theme-dark'
  | 'theme-system';

export type ActiveRouteMatchRule = {
  kind: 'exact' | 'prefix';
  path: string;
};

export type SharedNavAction =
  | {
      type: 'theme';
      theme: 'light' | 'dark' | 'system';
    }
  | {
      type: 'none';
    };

export type SharedNavItem = {
  id: string;
  label?: string;
  href?: string;
  iconKey?: NavIconKey;
  activeMatchRules?: ActiveRouteMatchRule[];
  children?: SharedNavItem[];
  action?: SharedNavAction;
};

export type SharedNavSection = {
  id: string;
  label: string;
  items: SharedNavItem[];
};

export type SharedNavBrand = {
  title: string;
  href: string;
  iconKey: NavIconKey;
};

export type SharedNavbarModel = {
  brand: SharedNavBrand;
  sections: SharedNavSection[];
  mobileQuickActionIds?: string[];
};
