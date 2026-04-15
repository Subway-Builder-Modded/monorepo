import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

type NavRowProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  active?: boolean;
  className?: string;
};

export function NavRow({ title, description, icon, active = false, className }: NavRowProps) {
  return (
    <div
      className={cn(
        'group flex h-full min-h-[3.25rem] items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-150',
        active
          ? 'bg-[color:var(--nav-muted)] text-[color:var(--nav-accent)]'
          : 'text-foreground hover:bg-[color:var(--nav-muted)] hover:translate-x-[1px]',
        className,
      )}
    >
      <div
        className={cn(
          'shrink-0 text-[color:var(--nav-accent)] [&_svg]:size-5',
          active ? 'opacity-95' : 'opacity-80',
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-semibold leading-tight',
            active ? 'text-[color:var(--nav-accent)]' : 'text-foreground',
          )}
        >
          {title}
        </p>
        {description ? (
          <p
            className={cn(
              'mt-0.5 whitespace-normal break-words text-xs leading-relaxed',
              active
                ? 'text-[color:color-mix(in_srgb,var(--nav-accent)_72%,var(--muted-foreground))]'
                : 'text-muted-foreground',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      <ChevronRight
        className={cn(
          'size-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5',
            active
              ? 'text-[color:var(--nav-accent)] opacity-60'
              : 'text-muted-foreground opacity-40 group-hover:text-foreground group-hover:opacity-60',
        )}
        aria-hidden="true"
      />
    </div>
  );
}