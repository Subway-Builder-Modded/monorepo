import type { ReactNode } from 'react';

export function ToolbarButton({
  title,
  active,
  onClick,
  disabled,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-all',
        active
          ? 'border-primary/45 bg-primary/15 text-foreground'
          : 'border-border/80 bg-card text-muted-foreground hover:border-primary/35 hover:bg-primary/10 hover:text-foreground',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
