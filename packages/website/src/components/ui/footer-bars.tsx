import * as React from 'react';
import { cn } from '@/lib/utils';

const SUBWAY_BARS = ['#0039A6', '#FF6319', '#00933C', '#FCCC0A', '#752F82'];

export function FooterBars({ className }: { className?: string }) {
  return (
    <div className={cn('w-full', className)}>
      <div className="mt-4 flex items-center justify-center gap-2">
        {SUBWAY_BARS.map((c) => (
          <span
            key={c}
            className="h-1.5 w-[clamp(18px,2.5vw,28px)] rounded-full"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}
