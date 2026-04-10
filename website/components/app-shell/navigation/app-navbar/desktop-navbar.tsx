import type { CSSProperties, Ref } from 'react';
import {
  Navbar,
  NavbarGap,
  NavbarSection,
  NavbarSpacer,
  NavbarStart,
  type NavbarProps,
} from '@/components/ui/navbar';
import type { AppNavbarBrand, AppNavbarItem } from '@/config/navigation/navbar';
import { cn } from '@subway-builder-modded/shared-ui';
import styles from '../app-navbar.module.css';
import { NAVBAR_DEFAULT_COLOR_SCHEME_ID } from './utils';
import { NavbarBrandLink } from './navbar-brand-link';
import { NavbarItemView } from './navbar-item';

type DesktopNavbarProps = NavbarProps & {
  headerRef: Ref<HTMLDivElement>;
  brand: AppNavbarBrand;
  leftItems: AppNavbarItem[];
  rightItems: AppNavbarItem[];
  compactLeftItems?: boolean;
  compactBrand?: boolean;
  pathname: string;
  onNavigate: () => void;
  setTheme: (theme: string) => void;
  configStyleVars: CSSProperties;
};

export function DesktopNavbar({
  headerRef,
  brand,
  leftItems,
  rightItems,
  compactLeftItems = false,
  compactBrand = false,
  pathname,
  onNavigate,
  setTheme,
  configStyleVars,
  ...props
}: DesktopNavbarProps) {
  return (
    <Navbar
      isSticky
      {...props}
      ref={headerRef}
      className={cn(styles.root, 'flex-nowrap')}
      style={configStyleVars}
      data-color-scheme={NAVBAR_DEFAULT_COLOR_SCHEME_ID}
    >
      <NavbarStart>
        <NavbarBrandLink
          brand={brand}
          onNavigate={onNavigate}
          compact={compactBrand}
        />
      </NavbarStart>

      <NavbarGap />

      <div
        aria-hidden="true"
        className="h-7 w-[3px] shrink-0 rounded-full bg-foreground/25"
      />

      <NavbarGap />

      <NavbarSection className="gap-1.5 md:gap-1.5">
        {leftItems.map((item) => (
          <NavbarItemView
            key={item.id}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
            setTheme={setTheme}
            configStyleVars={configStyleVars}
            compact={compactLeftItems}
          />
        ))}
      </NavbarSection>

      <NavbarSpacer />

      <NavbarSection className="max-md:hidden gap-1.5 md:gap-1.5">
        {rightItems.map((item) => (
          <NavbarItemView
            key={item.id}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
            setTheme={setTheme}
            configStyleVars={configStyleVars}
          />
        ))}
      </NavbarSection>
    </Navbar>
  );
}
