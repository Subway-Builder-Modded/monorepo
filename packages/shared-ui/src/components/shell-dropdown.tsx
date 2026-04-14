import { type CSSProperties, type ReactNode, useEffect, useId, useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

export type ShellDropdownOption = {
  id: string;
  label: string;
  icon?: ReactNode;
  tone?: {
    color: string;
    contrast: string;
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
  const listboxId = useId();

  const selected = useMemo(() => {
    return options.find((option) => option.id === selectedId) ?? options[0];
  }, [options, selectedId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
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

      {isOpen ? (
        <div
          className={cn(
            "absolute left-0 top-[calc(100%+0.625rem)] z-50 min-w-56 rounded-xl border border-border",
            "bg-background p-1 shadow-lg",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            menuClassName,
          )}
        >
          <ul id={listboxId} role="listbox" aria-label={triggerLabel} className="space-y-1">
            {options.map((option) => {
              const isSelected = option.id === selectedId;
              const optionStyle = option.tone
                ? ({
                    ["--option-accent" as string]: option.tone.color,
                    ["--option-contrast" as string]: option.tone.contrast,
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
                        ? "text-[color:var(--option-accent)] hover:bg-[color:var(--option-accent)] hover:text-[color:var(--option-contrast)]"
                        : "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected &&
                        (option.tone
                          ? "bg-[color:var(--option-accent)] text-[color:var(--option-contrast)]"
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
        </div>
      ) : null}
    </div>
  );
}
