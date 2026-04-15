import type { ReactNode } from 'react';

type FooterBrandBlockProps = {
  brand: {
    href?: string;
    logoSrc: string;
    title: string;
    description: string;
  };
  externalLinks: Array<{
    id: string;
    title: string;
    href: string;
    icon: ReactNode;
  }>;
};

export function FooterBrandBlock({ brand, externalLinks }: FooterBrandBlockProps) {
  const brandTitle = <h2 className="text-lg font-semibold tracking-tight text-foreground">{brand.title}</h2>;

  return (
    <section className="max-w-md">
      <div className="flex items-start gap-4">
        {brand.href ? (
          <a href={brand.href} aria-label="Go to home" className="shrink-0 rounded-lg">
            <img src={brand.logoSrc} alt="" aria-hidden="true" className="size-14 rounded-lg object-contain" />
          </a>
        ) : (
          <img
            src={brand.logoSrc}
            alt=""
            aria-hidden="true"
            className="size-14 shrink-0 rounded-lg object-contain"
          />
        )}
        <div className="min-w-0 pt-1">
          {brand.href ? (
            <a href={brand.href} className="inline-block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {brandTitle}
            </a>
          ) : (
            brandTitle
          )}
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
  );
}