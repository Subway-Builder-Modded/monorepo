import type { CSSProperties } from 'react';
import NextLink from 'next/link';
import type { AppNavbarItem } from '@/config/navigation/navbar';
import { APP_NAVBAR_CONFIG } from '@/config/navigation/navbar';
import { cn } from '@/lib/utils';
import { isExternalHref } from '@/lib/url';
import { NavbarDropdown } from './navbar-dropdown';
import { NavbarItemContent } from './navbar-item-content';
import {
  defaultItemHref,
  getDropdownItemActiveDepth,
  isActivePath,
  ITEM_SCHEME_VARIABLE_CLASS_NAME,
  resolveNavbarScheme,
  toSchemeStyle,
} from './utils';

type NavbarItemViewProps = {
  item: AppNavbarItem;
  pathname: string;
  onNavigate: () => void;
  setTheme: (theme: string) => void;
  configStyleVars: CSSProperties;
  compact?: boolean;
};

export function NavbarItemView({
  item,
  pathname,
  onNavigate,
  setTheme,
  configStyleVars,
  compact = false,
}: NavbarItemViewProps) {
  const itemScheme = resolveNavbarScheme(item.schemeId);
  const schemeStyle = toSchemeStyle(itemScheme);
  const iconScale =
    item.position === 'right' ? APP_NAVBAR_CONFIG.layout.rightItemIconScale : 1;

  const itemStyle =
    iconScale === 1
      ? schemeStyle
      : ({
          ...(schemeStyle ?? {}),
          ['--app-navbar-item-icon-scale' as string]: String(iconScale),
        } as CSSProperties);

  const itemHref = defaultItemHref(item);
  const isItemActive =
    typeof itemHref === 'string' ? isActivePath(pathname, itemHref) : false;
  const hasActiveDropdownPath =
    item.dropdown?.some(
      (dropdownItem) => getDropdownItemActiveDepth(pathname, dropdownItem) >= 0,
    ) ?? false;
  const isActive = isItemActive || hasActiveDropdownPath;
  const hasDropdown = Boolean(item.dropdown?.length);
  const isAlwaysOnHover = item.presentation?.restingState === 'hover';
  const hoverExpand = Boolean(item.presentation?.hoverExpand);
  const itemLabel = item.title ?? item.id;

  const baseClassName = cn(
    'group relative inline-flex min-w-0 items-center justify-center text-start font-semibold text-muted-fg no-underline outline-none transition-all duration-200 ease-[cubic-bezier(.22,.9,.35,1)]',
    'gap-[var(--app-navbar-item-gap)] rounded-[var(--app-navbar-item-radius)] px-[var(--app-navbar-item-px)] py-[var(--app-navbar-item-py)] text-[var(--app-navbar-item-title)]',
    'hover:bg-accent/45 hover:text-primary active:bg-accent/55',
    'data-[active=true]:bg-accent/45 data-[active=true]:text-primary',
    itemScheme && ITEM_SCHEME_VARIABLE_CLASS_NAME,
    itemScheme &&
      'hover:!bg-[var(--nav-active-bg)] hover:!text-[var(--nav-active-fg)] data-[state=open]:!bg-[var(--nav-active-bg)] data-[state=open]:!text-[var(--nav-active-fg)] data-[active=true]:!bg-[var(--nav-active-bg)] data-[active=true]:!text-[var(--nav-active-fg)]',
    itemScheme &&
      isAlwaysOnHover &&
      '!bg-[var(--nav-hover-bg)] !text-[var(--nav-hover-fg)]',
    hoverExpand &&
      'will-change-transform motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-[cubic-bezier(.22,.9,.35,1)] hover:scale-[1.04] data-[state=open]:scale-[1.04]',
  );

  if (hasDropdown) {
    return (
      <NavbarDropdown
        item={item}
        pathname={pathname}
        onNavigate={onNavigate}
        setTheme={setTheme}
        configStyleVars={configStyleVars}
      >
        <button
          type="button"
          data-active={isActive ? 'true' : 'false'}
          className={baseClassName}
          style={itemStyle}
          aria-label={compact || !item.title ? itemLabel : undefined}
        >
          <NavbarItemContent
            item={item}
            compact={compact}
            isActive={isActive}
            hasDropdown
            hasScheme={Boolean(itemScheme)}
          />
        </button>
      </NavbarDropdown>
    );
  }

  if (!itemHref) {
    return (
      <button
        type="button"
        data-active={isActive ? 'true' : 'false'}
        className={baseClassName}
        style={itemStyle}
        aria-label={compact || !item.title ? itemLabel : undefined}
      >
        <NavbarItemContent
          item={item}
          compact={compact}
          isActive={isActive}
          hasDropdown={false}
          hasScheme={Boolean(itemScheme)}
        />
      </button>
    );
  }

  const commonLinkProps = {
    'data-active': isActive ? 'true' : 'false',
    className: baseClassName,
    style: itemStyle,
    'aria-label': compact || !item.title ? itemLabel : undefined,
    onClick: onNavigate,
  } as const;

  if (isExternalHref(itemHref)) {
    return (
      <a href={itemHref} target="_blank" rel="noreferrer" {...commonLinkProps}>
        <NavbarItemContent
          item={item}
          compact={compact}
          isActive={isActive}
          hasDropdown={false}
          hasScheme={Boolean(itemScheme)}
        />
      </a>
    );
  }

  return (
    <NextLink href={itemHref} {...commonLinkProps}>
      <NavbarItemContent
        item={item}
        compact={compact}
        isActive={isActive}
        hasDropdown={false}
        hasScheme={Boolean(itemScheme)}
      />
    </NextLink>
  );
}
