import type { ReactNode } from 'react';

type SectionShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function HomeSectionShell({
  title,
  description,
  children,
}: SectionShellProps) {
  return (
    <section className="relative z-10 px-[clamp(1.25rem,4.5vw,3.5rem)]">
      <div className="w-full overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-background/96 via-background/90 to-background/84 px-[clamp(1.1rem,3.6vw,2.4rem)] py-14 shadow-md backdrop-blur-md sm:py-16">
        <div className="w-full">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          {description ? (
            <p className="mt-3 w-full text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function HomeSectionDivider() {
  return (
    <div
      className="relative z-10 px-[clamp(1.25rem,4.5vw,3.5rem)] py-7 sm:py-8"
      aria-hidden="true"
    >
      <div className="w-full">
        <div className="h-px bg-border/70" />
      </div>
    </div>
  );
}
