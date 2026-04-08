import NextLink from 'next/link';
import { AppIcon } from '@/components/shared/app-icon';
import type { AppNavbarBrand } from '@/config/navigation/navbar';
import { cn } from '@/lib/utils';

type NavbarBrandLinkProps = {
  brand: AppNavbarBrand;
  onNavigate: () => void;
  mobile?: boolean;
  compact?: boolean;
};

export function NavbarBrandLink({ brand, onNavigate }: NavbarBrandLinkProps) {
  return (
    <NextLink
      href={brand.href}
      className={cn(
        'group flex min-w-0 items-center text-muted-fg no-underline transition-colors duration-150 ease-out',
        'gap-[var(--app-navbar-brand-gap)] rounded-[var(--app-navbar-item-radius)] px-[var(--app-navbar-item-px)] py-[var(--app-navbar-item-py)]',
        'hover:bg-accent/45 hover:text-primary',
      )}
      aria-label={brand.title || 'Home'}
      onClick={onNavigate}
    >
      <AppIcon
        icon={brand.icon}
        className="shrink-0 text-current size-[var(--app-navbar-brand-icon)]"
      />
    </NextLink>
  );
}
