import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type ShellFooterLink = {
  id: string;
  title: string;
  href: string;
};

type ShellFooterGroup = {
  id: string;
  title: string;
  links: ShellFooterLink[];
};

type ShellFooterProps = {
  brand: {
    icon: ReactNode;
    title: string;
    description: string;
  };
  groups: ShellFooterGroup[];
  externalLinks: ShellFooterLink[];
  copyright: string;
  secondaryText?: string;
  className?: string;
};

export function ShellFooter({
  brand,
  groups,
  externalLinks,
  copyright,
  secondaryText,
  className,
}: ShellFooterProps) {
  return (
    <footer className={cn("mt-16 border-t border-border bg-background", className)}>
      <div className="h-px w-full bg-[linear-gradient(90deg,transparent_0%,var(--suite-accent)_28%,transparent_72%)] opacity-50" />
      <div className="mx-auto w-full max-w-[1200px] px-5 pb-8 pt-8 sm:px-7 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <section>
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center">{brand.icon}</span>
              <h2 className="text-sm font-semibold tracking-tight">{brand.title}</h2>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">{brand.description}</p>
          </section>

          {groups.map((group) => (
            <section key={group.id}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.href}
                      className="text-sm text-foreground/85 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Community
            </h3>
            <ul className="mt-3 space-y-2">
              {externalLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-foreground/85 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
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
