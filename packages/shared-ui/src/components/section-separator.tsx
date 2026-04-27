import type { ComponentType } from 'react';
import { cn } from '../lib/cn';

type SectionSeparatorIcon = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

export type SectionSeparatorProps = {
  label: string;
  icon?: SectionSeparatorIcon;
  className?: string;
  testId?: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
};

export function SectionSeparator({
  label,
  icon: Icon,
  className,
  testId,
  headingLevel,
}: SectionSeparatorProps) {
  const LabelTag = headingLevel ? (`h${headingLevel}` as const) : 'span';

  return (
    <div className={cn('mb-4 flex items-center gap-2.5', className)} data-testid={testId}>
      {Icon ? (
        <Icon className="size-3.5 shrink-0 translate-y-px text-muted-foreground" aria-hidden={true} />
      ) : null}
      <LabelTag className="text-[11px] font-bold uppercase tracking-[0.16em] leading-none text-muted-foreground">
        {label}
      </LabelTag>
      <div className="h-px flex-1 self-center bg-border/60" aria-hidden="true" />
    </div>
  );
}
