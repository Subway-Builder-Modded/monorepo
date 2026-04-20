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
    <div className={cn('mb-8 lg:mb-10 min-[1920px]:mb-12', className)}>
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
      <h2 className="text-[clamp(1.7rem,4.2vw,2.4rem)] font-extrabold tracking-[-0.03em] text-foreground sm:text-[clamp(2rem,3.3vw,2.7rem)] lg:text-[clamp(2.35rem,2.35vw,3.2rem)] min-[1920px]:text-[clamp(2.6rem,1.9vw,3.5rem)] min-[2560px]:text-[clamp(2.95rem,1.5vw,4rem)]">
        {title}
      </h2>
      {description && (
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base lg:mt-3 lg:text-[17px] min-[1920px]:max-w-3xl min-[1920px]:text-[18px] min-[2560px]:text-[19px]">
          {description}
        </p>
      )}
    </div>
  );
}
