import type { CSSProperties } from 'react';
import {
  NavbarMobile,
  NavbarSpacer,
  NavbarTrigger,
} from '@/components/ui/navbar';
import type { AppNavbarBrand, AppNavbarItem } from '@/config/navigation/navbar';
import { cn } from '@subway-builder-modded/shared-ui';
import styles from '../app-navbar.module.css';
import { NAVBAR_DEFAULT_COLOR_SCHEME_ID } from './utils';
import { NavbarBrandLink } from './navbar-brand-link';
import { NavbarItemView } from './navbar-item';

type MobileNavbarProps = {
  brand: AppNavbarBrand;
  quickItems: AppNavbarItem[];
  pathname: string;
  onNavigate: () => void;
  setTheme: (theme: string) => void;
  configStyleVars: CSSProperties;
};

export function MobileNavbar({
  brand,
  quickItems,
  pathname,
  onNavigate,
  setTheme,
  configStyleVars,
}: MobileNavbarProps) {
  return (
    <NavbarMobile
      className={cn(styles.root)}
      style={configStyleVars}
      data-color-scheme={NAVBAR_DEFAULT_COLOR_SCHEME_ID}
    >
      <NavbarTrigger />
      <NavbarBrandLink brand={brand} onNavigate={onNavigate} mobile />
      <NavbarSpacer />
      {quickItems.map((item) => (
        <NavbarItemView
          key={item.id}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
          setTheme={setTheme}
          configStyleVars={configStyleVars}
          compact
        />
      ))}
    </NavbarMobile>
  );
}
