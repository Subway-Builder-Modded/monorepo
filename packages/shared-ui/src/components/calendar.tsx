'use client';

import { cn } from '../lib/cn';
import { buttonVariants } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DateRange } from 'react-day-picker';
import * as React from 'react';

/** Re-export so consumers type range selections without a direct dependency. */
export type CalendarDateRange = DateRange;

/**
 * Month-grid calendar (react-day-picker) styled to the shared tokens. Range
 * selection, disabled-day matchers, and month navigation come from DayPicker;
 * this wrapper only maps its UI elements onto the design system.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      data-slot="calendar"
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        root: 'relative',
        months: 'relative flex flex-col gap-4 sm:flex-row',
        month: 'flex w-full flex-col gap-4',
        nav: 'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-7 p-0 text-muted-foreground hover:text-foreground',
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-7 p-0 text-muted-foreground hover:text-foreground',
        ),
        month_caption: 'flex h-7 w-full items-center justify-center',
        caption_label: 'text-sm font-semibold',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-8 text-[0.8rem] font-normal text-muted-foreground',
        week: 'mt-2 flex w-full',
        day: cn(
          'group/day relative size-8 p-0 text-center text-sm focus-within:relative focus-within:z-20',
          '[&:has(.range-middle)]:bg-accent [&:first-child:has(.range-middle)]:rounded-l-md [&:last-child:has(.range-middle)]:rounded-r-md',
        ),
        day_button: cn(
          'flex size-8 items-center justify-center rounded-md font-normal transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none',
        ),
        range_start:
          'rounded-l-md [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
        range_end:
          'rounded-r-md [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
        range_middle: 'range-middle bg-accent text-accent-foreground [&>button]:hover:bg-accent',
        selected: '[&>button]:font-semibold',
        today: '[&>button]:underline [&>button]:underline-offset-2',
        outside: 'text-muted-foreground/60',
        disabled: 'text-muted-foreground/40 line-through',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) =>
          orientation === 'left' ? (
            <ChevronLeft
              className={cn('size-4', chevronClassName)}
              {...chevronProps}
            />
          ) : (
            <ChevronRight
              className={cn('size-4', chevronClassName)}
              {...chevronProps}
            />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
