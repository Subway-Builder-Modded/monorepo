import type { AppIconValue } from '@/lib/icons';
import type { ProjectColorId } from '@/config/theme/contracts';
import type {
  SharedNavAction,
  SharedNavBrand,
  SharedNavItem,
} from '@subway-builder-modded/config';

type NavbarPosition = 'left' | 'right';

export type NavbarItemColors = {
  light: {
    text: string;
    background: string;
  };
  dark: {
    text: string;
    background: string;
  };
};

export type NavbarModeColor = {
  light: string;
  dark: string;
};

export type NavbarColorScheme = {
  hover?: NavbarItemColors;
  active?: NavbarItemColors;
  indicator?: NavbarModeColor;
};

type NavbarThemeId = 'light' | 'dark' | 'system';

type NavbarAction =
  | {
      type: 'theme';
      theme: NavbarThemeId;
    }
  | {
      type: 'none';
    };

type SharedNavbarItemCore = Pick<
  SharedNavItem,
  'id' | 'href' | 'iconKey' | 'activeMatchRules'
>;

export type AppNavbarDropdownItem = SharedNavbarItemCore & {
  title?: string;
  activeMatchPaths?: string[];
  icon?: AppIconValue;
  schemeId?: NavbarColorSchemeId;
  action?: SharedNavAction | NavbarAction;
};

export type AppNavbarItem = SharedNavbarItemCore & {
  title?: string;
  icon?: AppIconValue;
  position: NavbarPosition;
  schemeId?: NavbarColorSchemeId;
  presentation?: AppNavbarItemPresentation;
  dropdown?: AppNavbarDropdownItem[];
};

type AppNavbarItemPresentation = {
  restingState?: 'neutral' | 'hover';
  hoverExpand?: boolean;
};

export type AppNavbarBrand = Pick<
  SharedNavBrand,
  'title' | 'href' | 'iconKey'
> & {
  icon: AppIconValue;
};

type AppNavbarSizing = {
  brand: {
    gap: string;
    iconSize: string;
    titleSize: string;
    titleWeight: number;
  };
  item: {
    gap: string;
    iconSize: string;
    titleSize: string;
    radius: string;
    paddingX: string;
    paddingY: string;
  };
  dropdown: {
    minWidth: string;
    itemGap: string;
    itemIconSize: string;
    itemTitleSize: string;
    itemRadius: string;
    itemPaddingX: string;
    itemPaddingY: string;
  };
};

export type AppNavbarSizes = {
  mobile: AppNavbarSizing;
  desktop: AppNavbarSizing;
};

export type AppNavbarConfig = {
  brand: AppNavbarBrand;
  sizes: AppNavbarSizes;
  layout: {
    mobileQuickItemIds: string[];
    rightItemIconScale: number;
  };
  items: AppNavbarItem[];
};

export type NavbarColorSchemeId =
  | ProjectColorId
  | 'themeLight'
  | 'themeDark'
  | 'themeSystem';
