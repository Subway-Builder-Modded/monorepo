import type { AppIconValue } from '@/lib/icons';
import type { ProjectColorId } from '@/config/theme/contracts';

export type NavbarPosition = 'left' | 'right';

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

export type NavbarDropdownItem = {
  id: string;
  title?: string;
  href?: string;
  icon?: AppIconValue;
  colors?: NavbarItemColors;
  color?: NavbarItemColors;
};

export type NavbarItem = {
  id: string;
  title?: string;
  href?: string;
  icon?: AppIconValue;
  position: NavbarPosition;
  colors?: NavbarItemColors;
  color?: NavbarItemColors;
  dropdown?: NavbarDropdownItem[];
  specialStyle?: NavbarSpecialStyle;
  styleVars?: NavbarStyleVars;
};

export type NavbarSpecialStyle = {
  triggerClassName?: string;
  dropdownContentClassName?: string;
  dropdownItemClassName?: string;
  activeUnderlineClassName?: string;
};

export type NavbarStyleVars = {
  '--instance-accent-light': string;
  '--instance-accent-dark': string;
};

export type NavbarColorScheme = {
  hover?: NavbarItemColors;
  active?: NavbarItemColors;
  indicator?: NavbarModeColor;
};

export type NavbarThemeId = 'light' | 'dark' | 'system';

export type NavbarAction =
  | {
      type: 'theme';
      theme: NavbarThemeId;
    }
  | {
      type: 'none';
    };

export type AppNavbarDropdownItem = {
  id: string;
  title?: string;
  href?: string;
  activeMatchPaths?: string[];
  icon?: AppIconValue;
  schemeId?: NavbarColorSchemeId;
  action?: NavbarAction;
};

export type AppNavbarItem = {
  id: string;
  title?: string;
  href?: string;
  icon?: AppIconValue;
  position: NavbarPosition;
  schemeId?: NavbarColorSchemeId;
  presentation?: AppNavbarItemPresentation;
  dropdown?: AppNavbarDropdownItem[];
};

export type AppNavbarItemPresentation = {
  restingState?: 'neutral' | 'hover';
  hoverExpand?: boolean;
};

export type AppNavbarBrand = {
  title: string;
  href: string;
  icon: AppIconValue;
};

export type AppNavbarSizing = {
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
