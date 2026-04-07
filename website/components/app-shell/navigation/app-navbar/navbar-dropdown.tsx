import type { CSSProperties, ReactElement } from 'react';
import NextLink from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppIcon } from '@/components/shared/app-icon';
import type { AppNavbarItem } from '@/config/navigation/navbar';
import { cn } from '@/lib/utils';
import { isExternalHref } from '@/lib/url';
import styles from '../app-navbar.module.css';
import {
  getDropdownItemActiveDepth,
  ITEM_SCHEME_VARIABLE_CLASS_NAME,
  NAVBAR_DEFAULT_COLOR_SCHEME_ID,
  resolveNavbarScheme,
  toSchemeStyle,
} from './utils';
import { useDropdownHoverState } from './use-dropdown-hover-state';

type NavbarDropdownProps = {
  item: AppNavbarItem;
  pathname: string;
  onNavigate: () => void;
  setTheme: (theme: string) => void;
  configStyleVars: CSSProperties;
  children: ReactElement;
};

export function NavbarDropdown({
  item,
  pathname,
  onNavigate,
  setTheme,
  configStyleVars,
  children,
}: NavbarDropdownProps) {
  const dropdownItems = item.dropdown ?? [];
  const maxDropdownDepth = dropdownItems.reduce((best, dropdownItem) => {
    const depth = getDropdownItemActiveDepth(pathname, dropdownItem);
    return depth > best ? depth : best;
  }, -1);

  const {
    open,
    setOpenFromMenu,
    onTriggerPointerEnter,
    onTriggerPointerLeave,
    onTriggerMouseEnter,
    onTriggerMouseLeave,
    onContentPointerEnter,
    onContentPointerLeave,
  } = useDropdownHoverState();

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpenFromMenu}>
      <DropdownMenuTrigger
        asChild
        onPointerEnter={onTriggerPointerEnter}
        onPointerLeave={onTriggerPointerLeave}
        onMouseEnter={onTriggerMouseEnter}
        onMouseLeave={onTriggerMouseLeave}
      >
        {children}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={item.position === 'right' ? 'end' : 'start'}
        sideOffset={8}
        className={cn(styles.root, 'w-auto min-w-[var(--app-navbar-dd-minw)]')}
        style={configStyleVars}
        data-color-scheme={NAVBAR_DEFAULT_COLOR_SCHEME_ID}
        onPointerEnter={onContentPointerEnter}
        onPointerLeave={onContentPointerLeave}
      >
        {dropdownItems.map((dropdownItem) => {
          const scheme = resolveNavbarScheme(
            dropdownItem.schemeId ?? item.schemeId,
          );
          const style = toSchemeStyle(scheme);
          const href = dropdownItem.href;
          const activeDepth = getDropdownItemActiveDepth(
            pathname,
            dropdownItem,
          );
          const isActive = activeDepth >= 0 && activeDepth === maxDropdownDepth;
          const dropdownLabel = dropdownItem.title ?? dropdownItem.id;

          const className = cn(
            'gap-[var(--app-navbar-dd-item-gap)] rounded-[var(--app-navbar-dd-item-radius)] px-[var(--app-navbar-dd-item-px)] py-[var(--app-navbar-dd-item-py)] text-[var(--app-navbar-dd-item-title)] text-muted-fg hover:bg-accent/45 hover:text-primary hover:[&_*]:text-primary focus:bg-accent/45 focus:text-primary focus:[&_*]:text-primary data-[highlighted]:bg-accent/45 data-[highlighted]:text-primary data-[highlighted]:[&_*]:text-primary data-[active=true]:bg-accent/45 data-[active=true]:text-primary data-[active=true]:[&_*]:text-primary',
            scheme && ITEM_SCHEME_VARIABLE_CLASS_NAME,
            scheme &&
              'hover:!bg-[var(--nav-hover-bg)] hover:!text-[var(--nav-hover-fg)] hover:[&_*]:!text-[var(--nav-hover-fg)] focus:!bg-[var(--nav-hover-bg)] focus:!text-[var(--nav-hover-fg)] focus:[&_*]:!text-[var(--nav-hover-fg)] data-[highlighted]:!bg-[var(--nav-hover-bg)] data-[highlighted]:!text-[var(--nav-hover-fg)] data-[highlighted]:[&_*]:!text-[var(--nav-hover-fg)] data-[active=true]:!bg-[var(--nav-active-bg)] data-[active=true]:!text-[var(--nav-active-fg)] data-[active=true]:[&_*]:!text-[var(--nav-active-fg)]',
          );

          const icon = (
            <AppIcon
              icon={dropdownItem.icon}
              className="shrink-0 text-current size-[var(--app-navbar-dd-item-icon)]"
            />
          );

          const action = dropdownItem.action;
          if (action?.type === 'theme') {
            return (
              <DropdownMenuItem
                key={dropdownItem.id}
                onSelect={() => {
                  setTheme(action.theme);
                  onNavigate();
                }}
                data-active={isActive ? 'true' : 'false'}
                className={className}
                style={style}
                aria-label={dropdownItem.title ? undefined : dropdownLabel}
              >
                {icon}
                {dropdownItem.title ? (
                  <span className="truncate">{dropdownItem.title}</span>
                ) : null}
              </DropdownMenuItem>
            );
          }

          if (!href) {
            return (
              <DropdownMenuItem
                key={dropdownItem.id}
                onSelect={onNavigate}
                data-active={isActive ? 'true' : 'false'}
                className={className}
                style={style}
                aria-label={dropdownItem.title ? undefined : dropdownLabel}
              >
                {icon}
                {dropdownItem.title ? (
                  <span className="truncate">{dropdownItem.title}</span>
                ) : null}
              </DropdownMenuItem>
            );
          }

          if (isExternalHref(href)) {
            return (
              <DropdownMenuItem
                key={dropdownItem.id}
                asChild
                data-active={isActive ? 'true' : 'false'}
                className={className}
                style={style}
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center gap-2 no-underline"
                  onClick={onNavigate}
                  aria-label={dropdownItem.title ? undefined : dropdownLabel}
                >
                  {icon}
                  {dropdownItem.title ? (
                    <span className="truncate">{dropdownItem.title}</span>
                  ) : null}
                </a>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem
              key={dropdownItem.id}
              asChild
              data-active={isActive ? 'true' : 'false'}
              className={className}
              style={style}
            >
              <NextLink
                href={href}
                className="flex w-full items-center gap-2 no-underline"
                onClick={onNavigate}
                aria-label={dropdownItem.title ? undefined : dropdownLabel}
              >
                {icon}
                {dropdownItem.title ? (
                  <span className="truncate">{dropdownItem.title}</span>
                ) : null}
              </NextLink>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
