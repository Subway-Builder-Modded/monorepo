import { ChevronDownIcon } from 'lucide-react';
import { AppIcon } from '@/components/shared/app-icon';
import type { AppNavbarItem } from '@/config/navigation/navbar';
import { cn } from '@subway-builder-modded/shared-ui';

type NavbarItemContentProps = {
  item: AppNavbarItem;
  compact: boolean;
  isActive: boolean;
  hasDropdown: boolean;
  hasScheme: boolean;
};

export function NavbarItemContent({
  item,
  compact,
  isActive,
  hasDropdown,
  hasScheme,
}: NavbarItemContentProps) {
  const icon = item.icon ? (
    <AppIcon
      icon={item.icon}
      className="shrink-0 text-current size-[calc(var(--app-navbar-item-icon)*var(--app-navbar-item-icon-scale,1))]"
    />
  ) : null;

  return (
    <>
      {icon}
      {compact || !item.title ? null : (
        <span className="truncate">{item.title}</span>
      )}
      {hasDropdown ? (
        <ChevronDownIcon
          aria-hidden
          className={cn(
            'shrink-0 text-current opacity-70 transition-transform duration-200 ease-[cubic-bezier(.22,.9,.35,1)]',
            'size-[calc(var(--app-navbar-item-icon)*var(--app-navbar-item-icon-scale,1)*0.92)]',
            'group-data-[state=open]:rotate-180',
          )}
        />
      ) : null}
      {isActive ? (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute rounded-full',
            hasScheme ? 'bg-[var(--nav-indicator)]' : 'bg-primary',
            'inset-y-[calc(var(--app-navbar-item-py)/2)] -start-3 w-1 md:inset-x-2 md:inset-y-auto md:-bottom-[0.38rem] md:h-1 md:w-auto',
          )}
        />
      ) : null}
    </>
  );
}
