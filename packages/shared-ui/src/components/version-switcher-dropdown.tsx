'use client';

import { type CSSProperties, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';
import { SuiteStatusChip } from './suite-badge';

export type VersionSwitcherItemStatus = 'latest' | 'deprecated' | 'stable';

export type VersionSwitcherItem = {
  id: string;
  label: string;
  status?: VersionSwitcherItemStatus;
};

type VersionSwitcherDropdownProps = {
  items: VersionSwitcherItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  style?: CSSProperties;
};

type MenuPosition = {
  left: number;
  top: number;
  minWidth: number;
};

function getMenuPosition(trigger: HTMLButtonElement): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.bottom + 10,
    minWidth: Math.max(rect.width, 236),
  };
}

function isDeprecated(status: VersionSwitcherItemStatus | undefined) {
  return status === 'deprecated';
}

export function VersionSwitcherDropdown({
  items,
  selectedId,
  onSelect,
  ariaLabel = 'Choose version',
  className,
  triggerClassName,
  menuClassName,
  style,
}: VersionSwitcherDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [accentColor, setAccentColor] = useState('currentColor');

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0],
    [items, selectedId],
  );

  useEffect(() => {
    if (!triggerRef.current) {
      return;
    }

    // Resolve the active suite accent from the computed theme token so the
    // portaled menu can use the same color even outside the local DOM tree.
    const computed = getComputedStyle(triggerRef.current);
    const resolvedPrimary = computed.getPropertyValue('--primary').trim();
    const resolvedColor = resolvedPrimary || computed.color;
    if (resolvedColor) {
      setAccentColor(resolvedColor);
    }
  }, [open, selectedId, style]);

  useEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    setMenuPosition(getMenuPosition(triggerRef.current));

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
      setMenuPosition(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setMenuPosition(null);
      }
    };

    const closeMenu = () => {
      setOpen(false);
      setMenuPosition(null);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [open]);

  if (!selected) {
    return null;
  }

  const selectedDeprecated = isDeprecated(selected.status);

  const menu =
    open && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            className={cn(
              'fixed z-[45] rounded-xl border border-border/60 bg-background/98 p-1 shadow-[0_14px_34px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md',
              'animate-in fade-in-0 zoom-in-95 duration-150',
              menuClassName,
            )}
            style={{
              left: menuPosition.left,
              top: menuPosition.top,
              minWidth: menuPosition.minWidth,
              ['--switcher-accent' as string]: accentColor,
              ...style,
            }}
          >
            <ul id={listboxId} role='listbox' aria-label={ariaLabel} className='space-y-1'>
              {items.map((item) => {
                const selectedRow = item.id === selectedId;
                const deprecatedRow = isDeprecated(item.status);

                return (
                  <li key={item.id}>
                    <button
                      type='button'
                      role='option'
                      aria-selected={selectedRow}
                      data-tone={deprecatedRow ? 'deprecated' : 'suite'}
                      onClick={() => {
                        onSelect(item.id);
                        setOpen(false);
                        setMenuPosition(null);
                      }}
                      className={cn(
                        'flex w-full items-center justify-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium outline-none transition-colors',
                        'focus-visible:ring-2 focus-visible:ring-ring',
                        selectedRow
                          ? deprecatedRow
                            ? 'bg-muted text-foreground'
                            : 'bg-[color-mix(in_srgb,var(--switcher-accent)_17%,transparent)] text-[var(--switcher-accent)]'
                          : deprecatedRow
                            ? 'text-foreground/80 hover:bg-muted hover:text-foreground'
                            : 'text-[var(--switcher-accent)] hover:bg-[color-mix(in_srgb,var(--switcher-accent)_12%,transparent)] hover:text-[var(--switcher-accent)]',
                      )}
                    >
                      <span className='min-w-0 truncate'>{item.label}</span>

                      {item.status === 'latest' ? (
                        <SuiteStatusChip status='latest' size='sm' className='ml-1 shrink-0' />
                      ) : null}

                      {item.status === 'deprecated' ? (
                        <SuiteStatusChip
                          status='deprecated'
                          deprecatedTone='gray'
                          size='sm'
                          className='ml-1 shrink-0'
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={rootRef}
        className={cn('relative', className)}
        style={{ ['--switcher-accent' as string]: accentColor, ...style }}
      >
        <button
          ref={triggerRef}
          type='button'
          aria-haspopup='listbox'
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          data-tone={selectedDeprecated ? 'deprecated' : 'suite'}
          onClick={() => {
            // Avoid one-frame stale placement by forcing a fresh position
            // calc before the portal can render.
            setMenuPosition(null);
            setOpen((prev) => !prev);
          }}
          className={cn(
            'inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/92 px-3 text-sm font-semibold shadow-[0_10px_22px_-16px_rgba(0,0,0,0.4)] outline-none transition-colors',
            'focus-visible:ring-2 focus-visible:ring-ring',
            selectedDeprecated
              ? 'border-border text-foreground/80 hover:bg-muted hover:text-foreground'
              : 'text-[var(--switcher-accent)] hover:border-[var(--switcher-accent)] hover:bg-[color-mix(in_srgb,var(--switcher-accent)_12%,transparent)] hover:text-[var(--switcher-accent)]',
            open &&
              (selectedDeprecated
                ? 'bg-muted text-foreground'
                : 'bg-[color-mix(in_srgb,var(--switcher-accent)_12%,transparent)] text-[var(--switcher-accent)]'),
            triggerClassName,
          )}
        >
          <span className='flex min-w-0 items-center gap-2'>
            <span className='min-w-0 truncate'>{selected.label}</span>

            {selected.status === 'latest' ? (
              <SuiteStatusChip status='latest' size='sm' className='shrink-0' />
            ) : null}
            {selected.status === 'deprecated' ? (
              <SuiteStatusChip
                status='deprecated'
                deprecatedTone='gray'
                size='sm'
                className='shrink-0'
              />
            ) : null}
          </span>
          <ChevronDown
            aria-hidden='true'
            className={cn('size-4 shrink-0 transition-transform duration-200 ease-out', open && 'rotate-180')}
          />
        </button>
      </div>
      {menu}
    </>
  );
}