import { cn } from '../lib/cn';

export type SectionHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  accentColor?: string;
  className?: string;
};

export function SectionHeader({
  kicker,
  title,
  description,
  accentColor,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {kicker && (
        <div className="mb-3 flex items-center gap-2.5">
          <span
            className="h-0.5 w-5 rounded-full"
            style={{
              backgroundColor: accentColor ?? 'currentColor',
              opacity: accentColor ? 1 : 0.35,
            }}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {kicker}
          </span>
        </div>
      )}
      <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
