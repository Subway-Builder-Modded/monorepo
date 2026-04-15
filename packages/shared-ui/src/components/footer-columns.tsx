import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type FooterLink = {
  id: string;
  title: string;
  href: string;
  icon?: ReactNode;
  accentLight?: string;
  accentDark?: string;
  mutedLight?: string;
  mutedDark?: string;
};

export type FooterColumn = {
  id: string;
  title: string;
  accentColor: string;
  links: FooterLink[];
};

type FooterColumnsProps = {
  columns: FooterColumn[];
};

function FooterLinkRow({ link }: { link: FooterLink }) {
  const style =
    link.accentLight || link.accentDark || link.mutedLight || link.mutedDark
      ? ({
          ['--link-accent-light' as string]: link.accentLight ?? 'currentColor',
          ['--link-accent-dark' as string]: link.accentDark ?? link.accentLight ?? 'currentColor',
          ['--link-muted-light' as string]: link.mutedLight ?? 'transparent',
          ['--link-muted-dark' as string]: link.mutedDark ?? link.mutedLight ?? 'transparent',
        } as CSSProperties)
      : undefined;

  return (
    <a
      href={link.href}
      className={cn(
        'inline-flex min-h-7 w-full items-center gap-2 rounded-md px-2 text-sm text-foreground/85 transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        link.accentLight || link.accentDark || link.mutedLight || link.mutedDark
          ? 'hover:bg-[color:var(--link-muted-light)] hover:text-[color:var(--link-accent-light)] dark:hover:bg-[color:var(--link-muted-dark)] dark:hover:text-[color:var(--link-accent-dark)]'
          : 'hover:bg-accent/60 hover:text-foreground',
      )}
      style={style}
    >
      {link.icon ? <span className="shrink-0 [&_svg]:size-4">{link.icon}</span> : null}
      <span className="truncate">{link.title}</span>
    </a>
  );
}

export function FooterColumns({ columns }: FooterColumnsProps) {
  return (
    <section className="mx-auto flex w-full max-w-[62rem] flex-wrap justify-center gap-x-3 gap-y-5 sm:gap-x-4 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(7.5rem,8.5rem))] lg:justify-center lg:gap-x-1">
      {columns.map((column) => (
        <div key={column.id} className="min-w-0 shrink-0 basis-[8.75rem] sm:basis-[9.5rem] lg:basis-auto">
          <div className="min-h-[2.25rem]">
            <span aria-hidden="true" className="mb-1 block h-0.5 w-8 rounded-full" style={{ backgroundColor: column.accentColor }} />
            <h3
              className="text-xs font-semibold uppercase leading-tight tracking-[0.14em]"
              style={{ color: column.accentColor }}
            >
              {column.title}
            </h3>
          </div>
          <ul className="mt-0.5 space-y-1.5">
            {column.links.map((link) => (
              <li key={link.id}>
                <FooterLinkRow link={link} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}