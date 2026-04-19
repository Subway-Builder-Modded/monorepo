import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { APP_SHELL_OUTER_CONTAINER_CLASS } from '../lib/layout-tokens';
import { FooterBrandBlock } from './footer-brand-block';
import { FooterColumns, type FooterColumn } from './footer-columns';

type AppFooterProps = {
  brand: {
    href?: string;
    logoSrc: string;
    title: string;
    description: string;
  };
  columns: FooterColumn[];
  externalLinks: Array<{
    id: string;
    title: string;
    href: string;
    icon: ReactNode;
  }>;
  copyright: string;
  secondaryText?: string;
  className?: string;
};

export function AppFooter({
  brand,
  columns,
  externalLinks,
  copyright,
  secondaryText,
  className,
}: AppFooterProps) {
  return (
    <footer className={cn('border-t border-border bg-background', className)}>
      <div className={cn(APP_SHELL_OUTER_CONTAINER_CLASS, 'pb-8 pt-9')}>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,2.65fr)]">
          <FooterBrandBlock brand={brand} externalLinks={externalLinks} />
          <FooterColumns columns={columns} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>{copyright}</span>
          {secondaryText ? <span>{secondaryText}</span> : null}
        </div>
      </div>
    </footer>
  );
}