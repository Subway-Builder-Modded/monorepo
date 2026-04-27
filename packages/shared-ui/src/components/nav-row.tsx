import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

type NavRowProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  active?: boolean;
  showChevron?: boolean;
  trailing?: ReactNode;
  className?: string;
};

export function NavRow({
  title,
  description,
  icon,
  active = false,
  showChevron = true,
  trailing,
  className,
}: NavRowProps) {
  return (
    <div
      className={cn(
        'group flex h-full min-h-[clamp(3rem,5.5vw,3.9rem)] items-start gap-[clamp(0.55rem,1vw,0.8rem)] rounded-[clamp(0.55rem,1vw,0.85rem)] px-[clamp(0.65rem,1vw,0.9rem)] py-[clamp(0.5rem,0.9vw,0.75rem)] transition-all duration-150',
        active
          ? 'bg-[color:var(--nav-muted)] text-[color:var(--nav-accent)]'
          : 'text-foreground hover:bg-[color:var(--nav-muted)]',
        className,
      )}
    >
      <div
        className={cn(
          'shrink-0 text-[color:var(--nav-accent)] [&_svg]:size-[clamp(1rem,1.5vw,1.25rem)]',
          active ? 'opacity-95' : 'opacity-80',
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-[clamp(0.85rem,1.1vw,0.96rem)] font-semibold leading-tight',
            active ? 'text-[color:var(--nav-accent)]' : 'text-foreground',
          )}
        >
          {title}
        </p>
        {description ? (
          <p
            className={cn(
              'mt-[clamp(0.1rem,0.45vw,0.22rem)] whitespace-normal break-words text-[clamp(0.72rem,0.95vw,0.82rem)] leading-relaxed',
              active
                ? 'text-[color:color-mix(in_srgb,var(--nav-accent)_72%,var(--muted-foreground))]'
                : 'text-muted-foreground',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {trailing ? (
        <div className="shrink-0">{trailing}</div>
      ) : showChevron ? (
        <ChevronRight
          className={cn(
            'size-[clamp(0.75rem,1.05vw,0.9rem)] shrink-0 transition-transform duration-150',
            active
              ? 'text-[color:var(--nav-accent)] opacity-60'
              : 'text-muted-foreground opacity-40 group-hover:text-foreground group-hover:opacity-60',
          )}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}