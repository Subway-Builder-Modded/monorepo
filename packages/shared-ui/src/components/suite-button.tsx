import type { ComponentType, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type SuiteAccent = {
  light: string;
  dark: string;
};

export type SuiteButtonVariant = 'solid' | 'outline';

export type SuiteButtonProps = {
  accent: SuiteAccent;
  variant?: SuiteButtonVariant;
  isDark: boolean;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
} & (
  | ({ as?: 'button' } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ as: 'a' } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
);

export function SuiteButton({
  accent,
  variant = 'solid',
  isDark,
  icon: Icon,
  children,
  className,
  ...props
}: SuiteButtonProps) {
  const color = isDark ? accent.dark : accent.light;

  const solidClass =
    'border-transparent shadow-sm hover:brightness-110';
  const outlineClass =
    'bg-transparent hover:bg-[var(--suite-btn-hover)]';

  const base = cn(
    'inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all',
    variant === 'solid' ? solidClass : outlineClass,
    className,
  );

  const style: React.CSSProperties =
    variant === 'solid'
      ? { backgroundColor: color }
      : {
          borderColor: `${color}40`,
          color,
          '--suite-btn-hover': `${color}12`,
        } as React.CSSProperties;

  const content = (
    <>
      {Icon && <Icon className="size-3.5" aria-hidden="true" />}
      {children}
    </>
  );

  if (props.as === 'a') {
    const { as: _, ...rest } = props as { as: 'a' } & React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a className={base} style={style} {...rest}>
        {content}
      </a>
    );
  }

  const { as: _, ...rest } = props as { as?: 'button' } & React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={base} style={style} {...rest}>
      {content}
    </button>
  );
}
