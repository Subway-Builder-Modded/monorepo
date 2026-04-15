import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/cn";

type ShellFooterLink = {
  id: string;
  title: string;
  href: string;
  icon?: ReactNode;
  accentLight?: string;
  accentDark?: string;
  mutedLight?: string;
  mutedDark?: string;
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
    link.accentLight || link.accentDark || link.mutedLight || link.mutedDark
      ? ({
          ["--link-accent-light" as string]: link.accentLight ?? "currentColor",
          ["--link-accent-dark" as string]: link.accentDark ?? link.accentLight ?? "currentColor",
          ["--link-muted-light" as string]: link.mutedLight ?? "transparent",
          ["--link-muted-dark" as string]: link.mutedDark ?? link.mutedLight ?? "transparent",
        } as CSSProperties)
      : undefined;

  return (
    <a
      href={link.href}
      className={cn(
        "inline-flex min-h-7 w-full items-center gap-2 rounded-md px-2 text-sm text-foreground/85 transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        link.accentLight || link.accentDark || link.mutedLight || link.mutedDark
          ? "hover:bg-[color:var(--link-muted-light)] hover:text-[color:var(--link-accent-light)] dark:hover:bg-[color:var(--link-muted-dark)] dark:hover:text-[color:var(--link-accent-dark)]"
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

          <section className="mx-auto grid w-full max-w-[62rem] grid-cols-[repeat(auto-fit,minmax(7.5rem,8.5rem))] justify-center gap-x-1 gap-y-5">
            {columns.map((column) => (
              <div key={column.id} className="min-w-0">
                <div className="min-h-[2.25rem]">
                  <span
                    aria-hidden="true"
                    className="mb-1 block h-0.5 w-8 rounded-full"
                    style={{ backgroundColor: column.accentColor }}
                  />
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
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>{copyright}</span>
          {secondaryText ? <span>{secondaryText}</span> : null}
        </div>
      </div>
    </footer>
  );
}
