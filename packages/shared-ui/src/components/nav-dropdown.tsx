'use client';

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';

export type NavDropdownOption = {
  id: string;
  label: string;
  icon?: ReactNode;
  tone?: {
    color: string;
    muted: string;
  };
};

type NavDropdownProps = {
  options: NavDropdownOption[];
  selectedId: string;
  hideSelectedLabel?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  triggerLabel?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
};

type MenuPosition = {
  left: number;
  top: number;
  minWidth: number;
};

export function NavDropdown({
  options,
  selectedId,
  hideSelectedLabel = false,
  isOpen,
  onOpenChange,
  onSelect,
  triggerLabel = 'Select option',
  className,
  triggerClassName,
  menuClassName,
}: NavDropdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const selected = useMemo(() => {
    return options.find((option) => option.id === selectedId) ?? options[0];
  }, [options, selectedId]);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    const updateMenuPosition = () => {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        left: rect.left,
        top: rect.bottom + 10,
        minWidth: Math.max(rect.width, 224),
      });
    };

    updateMenuPosition();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      onOpenChange(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, onOpenChange]);

  const menu =
    isOpen && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            className={cn(
              'fixed z-[80] rounded-xl border border-border bg-background p-1 shadow-lg',
              'animate-in fade-in-0 zoom-in-95 duration-200',
              menuClassName,
            )}
            style={{
              left: menuPosition.left,
              top: menuPosition.top,
              minWidth: menuPosition.minWidth,
            }}
          >
            <ul id={listboxId} role="listbox" aria-label={triggerLabel} className="space-y-1">
              {options.map((option) => {
                const isSelected = option.id === selectedId;
                const optionStyle = option.tone
                  ? ({
                      ['--option-color' as string]: option.tone.color,
                      ['--option-muted' as string]: option.tone.muted,
                    } as CSSProperties)
                  : undefined;

                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelect(option.id);
                        onOpenChange(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm',
                        'outline-none transition',
                        option.tone
                          ? 'text-[color:var(--option-color)] hover:bg-[color:var(--option-muted)]'
                          : 'hover:bg-accent hover:text-accent-foreground',
                        'focus-visible:ring-2 focus-visible:ring-ring',
                        isSelected &&
                          (option.tone
                            ? 'bg-[color:var(--option-muted)] font-medium'
                            : 'bg-accent text-accent-foreground'),
                      )}
                      style={optionStyle}
                    >
                      {option.icon}
                      <span>{option.label}</span>
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
      <div ref={rootRef} className={cn('relative', className)}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-label={triggerLabel}
          onClick={() => onOpenChange(!isOpen)}
          className={cn(
            'inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-lg px-1 py-0.5',
            'text-sm font-semibold outline-none transition',
            'focus-visible:ring-2 focus-visible:ring-ring',
            triggerClassName,
          )}
        >
          <span className="shrink-0">{selected?.icon}</span>
          {!hideSelectedLabel ? (
            <span className="max-w-[9.5rem] overflow-hidden text-ellipsis sm:max-w-none">
              {selected?.label}
            </span>
          ) : null}
          <ChevronDown
            aria-hidden="true"
            className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
          />
        </button>
      </div>
      {menu}
    </>
  );
}