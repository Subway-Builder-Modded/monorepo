import type { CSSProperties } from 'react';
import { cn } from '../lib/cn';

export type AccentSegment = {
  light: string;
  dark: string;
};

export type HeroAccentBarProps = {
  segments: AccentSegment[];
  height?: string;
  className?: string;
};

export function HeroAccentBar({ segments, height = 'h-1', className }: HeroAccentBarProps) {
  return (
    <div
      className={cn('absolute inset-x-0 bottom-0 flex', height, className)}
      aria-hidden={true}
    >
      {segments.map((seg, i) => (
        <div
          key={i}
          className="flex-1"
          style={
            {
              '--bar-light': seg.light,
              '--bar-dark': seg.dark,
            } as CSSProperties
          }
        >
          <div className="hidden size-full dark:block" style={{ backgroundColor: 'var(--bar-dark)' }} />
          <div className="size-full dark:hidden" style={{ backgroundColor: 'var(--bar-light)' }} />
        </div>
      ))}
    </div>
  );
}
