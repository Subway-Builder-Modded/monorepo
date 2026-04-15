import { type CSSProperties, type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

export type ShellDropdownOption = {
  id: string;
  label: string;
  icon?: ReactNode;
  tone?: {
    /** Accent color used for text and icon. */
    color: string;
    /** Semi-transparent color used for hover/selected background. */
    muted: string;
  };
};

type ShellDropdownProps = {
  options: ShellDropdownOption[];
  selectedId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  triggerLabel?: string;
  className?: string;
  menuClassName?: string;
};

type MenuPosition = {
  left: number;
  top: number;
  minWidth: number;
};

export function ShellDropdown({
  options,
  selectedId,
  isOpen,
  onOpenChange,
  onSelect,
  triggerLabel = "Select option",
  className,
  menuClassName,
}: ShellDropdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const selected = useMemo(() => {
    return options.find((option) => option.id === selectedId) ?? options[0];
  }, [options, selectedId]);

  const updateMenuPosition = useMemo(() => {
    return () => {
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
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateMenuPosition();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      if (menuRef.current?.contains(target)) {
        return;
      }
      onOpenChange(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    const onWindowChange = () => {
      updateMenuPosition();
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
    };
  }, [isOpen, onOpenChange, updateMenuPosition]);

  const menu =
    isOpen && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            className={cn(
              "fixed z-[80] rounded-xl border border-border bg-background p-1 shadow-lg",
              "animate-in fade-in-0 zoom-in-95 duration-200",
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
                      ["--option-color" as string]: option.tone.color,
                      ["--option-muted" as string]: option.tone.muted,
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
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                        "outline-none transition",
                        option.tone
                          ? "text-[color:var(--option-color)] hover:bg-[color:var(--option-muted)]"
                          : "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected &&
                          (option.tone
                            ? "bg-[color:var(--option-muted)] font-medium"
                            : "bg-accent text-accent-foreground"),
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
      <div ref={rootRef} className={cn("relative", className)}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-label={triggerLabel}
          onClick={() => onOpenChange(!isOpen)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-1 py-0.5",
            "text-sm font-semibold outline-none transition",
            "focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {selected?.icon}
          <span>{selected?.label}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn("size-4 transition-transform", isOpen && "rotate-180")}
          />
        </button>
      </div>
      {menu}
    </>
  );
}
