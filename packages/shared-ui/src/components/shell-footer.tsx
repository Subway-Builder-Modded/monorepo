import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/cn";

type ShellFooterLink = {
  id: string;
  title: string;
  href: string;
  icon?: ReactNode;
  accentColor?: string;
  mutedColor?: string;
};

type ShellFooterColumn = {
  id: string;
  title: string;
  accentColor: string;
  links: ShellFooterLink[];
};

type ShellFooterProps = {
  brand: {
    logoSrc: string;
    title: string;
    description: string;
  };
  columns: ShellFooterColumn[];
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

function FooterLinkRow({ link }: { link: ShellFooterLink }) {
  const style =
    link.accentColor || link.mutedColor
      ? ({
          ["--link-accent" as string]: link.accentColor ?? "currentColor",
          ["--link-muted" as string]: link.mutedColor ?? "transparent",
        } as CSSProperties)
      : undefined;

  return (
    <a
      href={link.href}
      className={cn(
        "inline-flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-foreground/85 transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        link.accentColor || link.mutedColor
          ? "hover:bg-[color:var(--link-muted)] hover:text-[color:var(--link-accent)]"
          : "hover:bg-accent/60 hover:text-foreground",
      )}
      style={style}
    >
      {link.icon ? <span className="shrink-0 [&_svg]:size-4">{link.icon}</span> : null}
      <span className="truncate">{link.title}</span>
    </a>
  );
}

export function ShellFooter({
  brand,
  columns,
  externalLinks,
  copyright,
  secondaryText,
  className,
}: ShellFooterProps) {
  return (
    <footer className={cn("mt-16 border-t border-border bg-background", className)}>
      <div className="mx-auto w-full max-w-[1200px] px-5 pb-8 pt-9 sm:px-7 lg:px-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,2.65fr)]">
          <section className="max-w-md">
            <div className="flex items-start gap-4">
              <img
                src={brand.logoSrc}
                alt=""
                aria-hidden="true"
                className="size-14 shrink-0 rounded-lg object-contain"
              />
              <div className="min-w-0 pt-1">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">{brand.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{brand.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  {externalLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.title}
                      className="inline-flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-wrap justify-center gap-x-4 gap-y-6">
            {columns.map((column) => (
              <div key={column.id} className="w-[min(7rem,100%)]">
                <span
                  aria-hidden="true"
                  className="mb-2 block h-0.5 w-8 rounded-full"
                  style={{ backgroundColor: column.accentColor }}
                />
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: column.accentColor }}>
                  {column.title}
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.id}>
                      <FooterLinkRow link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>{copyright}</span>
          {secondaryText ? <span>{secondaryText}</span> : null}
        </div>
      </div>
    </footer>
  );
}
