type DocsPageTitleCardProps = {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> | null;
};

export function DocsPageTitleCard({ title, description, icon: Icon }: DocsPageTitleCardProps) {
  return (
    <header className="mb-4 rounded-2xl border-2 border-[color-mix(in_srgb,var(--suite-accent-light)_22%,var(--border))] bg-background/55 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_13%,transparent)] text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)] dark:text-[var(--suite-accent-dark)]">
          {Icon ? <Icon className="size-5" aria-hidden={true} /> : null}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-[-0.02em] text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
