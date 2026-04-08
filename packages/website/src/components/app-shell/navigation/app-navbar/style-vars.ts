import type { CSSProperties } from 'react';
import type { AppNavbarSizes } from '@/config/navigation/navbar';

export function createNavbarConfigStyleVars(
  sizes: AppNavbarSizes,
): CSSProperties {
  const vars: Record<string, string> = {
    '--app-navbar-brand-gap-mobile': sizes.mobile.brand.gap,
    '--app-navbar-brand-gap-desktop': sizes.desktop.brand.gap,
    '--app-navbar-brand-icon-mobile': sizes.mobile.brand.iconSize,
    '--app-navbar-brand-icon-desktop': sizes.desktop.brand.iconSize,
    '--app-navbar-brand-title-mobile': sizes.mobile.brand.titleSize,
    '--app-navbar-brand-title-desktop': sizes.desktop.brand.titleSize,
    '--app-navbar-brand-weight-mobile': String(sizes.mobile.brand.titleWeight),
    '--app-navbar-brand-weight-desktop': String(
      sizes.desktop.brand.titleWeight,
    ),

    '--app-navbar-item-gap-mobile': sizes.mobile.item.gap,
    '--app-navbar-item-gap-desktop': sizes.desktop.item.gap,
    '--app-navbar-item-icon-mobile': sizes.mobile.item.iconSize,
    '--app-navbar-item-icon-desktop': sizes.desktop.item.iconSize,
    '--app-navbar-item-title-mobile': sizes.mobile.item.titleSize,
    '--app-navbar-item-title-desktop': sizes.desktop.item.titleSize,
    '--app-navbar-item-radius-mobile': sizes.mobile.item.radius,
    '--app-navbar-item-radius-desktop': sizes.desktop.item.radius,
    '--app-navbar-item-px-mobile': sizes.mobile.item.paddingX,
    '--app-navbar-item-px-desktop': sizes.desktop.item.paddingX,
    '--app-navbar-item-py-mobile': sizes.mobile.item.paddingY,
    '--app-navbar-item-py-desktop': sizes.desktop.item.paddingY,

    '--app-navbar-dd-minw-mobile': sizes.mobile.dropdown.minWidth,
    '--app-navbar-dd-minw-desktop': sizes.desktop.dropdown.minWidth,
    '--app-navbar-dd-item-gap-mobile': sizes.mobile.dropdown.itemGap,
    '--app-navbar-dd-item-gap-desktop': sizes.desktop.dropdown.itemGap,
    '--app-navbar-dd-item-icon-mobile': sizes.mobile.dropdown.itemIconSize,
    '--app-navbar-dd-item-icon-desktop': sizes.desktop.dropdown.itemIconSize,
    '--app-navbar-dd-item-title-mobile': sizes.mobile.dropdown.itemTitleSize,
    '--app-navbar-dd-item-title-desktop': sizes.desktop.dropdown.itemTitleSize,
    '--app-navbar-dd-item-radius-mobile': sizes.mobile.dropdown.itemRadius,
    '--app-navbar-dd-item-radius-desktop': sizes.desktop.dropdown.itemRadius,
    '--app-navbar-dd-item-px-mobile': sizes.mobile.dropdown.itemPaddingX,
    '--app-navbar-dd-item-px-desktop': sizes.desktop.dropdown.itemPaddingX,
    '--app-navbar-dd-item-py-mobile': sizes.mobile.dropdown.itemPaddingY,
    '--app-navbar-dd-item-py-desktop': sizes.desktop.dropdown.itemPaddingY,
  };

  return vars as CSSProperties;
}
