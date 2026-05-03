import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from "@subway-builder-modded/shared-ui";

export type RegistryToolbarDropdownOption = {
  id: string;
  label: string;
  icon?: LucideIcon;
};

type RegistryToolbarDropdownProps = {
  options: RegistryToolbarDropdownOption[];
  value?: string;
  values?: string[];
  onValueChange?: (value: string) => void;
  onValuesChange?: (values: string[]) => void;
  multiSelect?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  triggerContent: React.ReactNode;
  triggerAriaLabel?: string;
  triggerClassName?: string;
  contentClassName?: string;
  footerContent?: React.ReactNode;
  align?: "start" | "center" | "end";
};

export function RegistryToolbarDropdown({
  options,
  value,
  values = [],
  onValueChange,
  onValuesChange,
  multiSelect = false,
  searchable = false,
  searchPlaceholder = "Search...",
  triggerContent,
  triggerClassName,
  contentClassName,
  footerContent,
  align = "end",
}: RegistryToolbarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resolvedAccent, setResolvedAccent] = useState<{ light: string; dark: string } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const handleToggleValue = (id: string) => {
    if (multiSelect) {
      const exists = values.includes(id);
      const next = exists ? values.filter((v) => v !== id) : [...values, id];
      onValuesChange?.(next);
      return;
    }

    onValueChange?.(id);
    setIsOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && triggerRef.current) {
      const computed = window.getComputedStyle(triggerRef.current);
      const light = computed.getPropertyValue("--suite-accent-light").trim();
      const dark = computed.getPropertyValue("--suite-accent-dark").trim();
      setResolvedAccent({
        light: light || "var(--primary)",
        dark: dark || "var(--primary)",
      });
    }
    setIsOpen(nextOpen);
  };

  const shouldConstrainListHeight = filteredOptions.length > 7;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          className={cn(
            "[--tb-accent-light:var(--suite-accent-light,var(--primary))] [--tb-accent-dark:var(--suite-accent-dark,var(--primary))] inline-flex h-10 items-center gap-2 rounded-lg border border-border/50 bg-background px-3 text-sm font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-[color-mix(in_srgb,var(--tb-accent-light)_10%,var(--background))] hover:text-[var(--tb-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--tb-accent-dark)_12%,var(--background))] dark:hover:text-[var(--tb-accent-dark)]",
            triggerClassName,
          )}
        >
          {triggerContent}
          <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden={true} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        side="top"
        sideOffset={4}
        style={
          resolvedAccent
            ? ({
                "--tb-accent-light": resolvedAccent.light,
                "--tb-accent-dark": resolvedAccent.dark,
              } as React.CSSProperties)
            : undefined
        }
        className={cn(
          "[--tb-accent-light:var(--suite-accent-light,var(--primary))] [--tb-accent-dark:var(--suite-accent-dark,var(--primary))] z-[80] w-64 overflow-hidden border-border/50 bg-background p-0",
          contentClassName,
        )}
      >
        {searchable ? (
          <div className="border-b border-border/50 p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden={true}
              />
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 w-full appearance-none rounded-md border border-border/50 bg-background pl-8 pr-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
              />
            </div>
          </div>
        ) : null}

        <ScrollArea
          className={cn(
            shouldConstrainListHeight ? "h-[min(16rem,50vh)]" : "h-auto",
            "[scrollbar-gutter:stable]",
          )}
        >
          <div className={cn("p-1", shouldConstrainListHeight && "pr-2")}>
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">No results</p>
            ) : (
              filteredOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = multiSelect ? values.includes(option.id) : option.id === value;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role={multiSelect ? "checkbox" : "menuitemradio"}
                    aria-checked={isSelected}
                    onClick={() => handleToggleValue(option.id)}
                    className={cn(
                      "group flex h-10 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "bg-[color-mix(in_srgb,var(--tb-accent-light)_14%,var(--background))] text-[var(--tb-accent-light)] hover:bg-[color-mix(in_srgb,var(--tb-accent-light)_20%,var(--background))] hover:text-[var(--tb-accent-light)] focus-visible:bg-[color-mix(in_srgb,var(--tb-accent-light)_20%,var(--background))] focus-visible:text-[var(--tb-accent-light)] dark:bg-[color-mix(in_srgb,var(--tb-accent-dark)_16%,var(--background))] dark:text-[var(--tb-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--tb-accent-dark)_22%,var(--background))] dark:hover:text-[var(--tb-accent-dark)] dark:focus-visible:bg-[color-mix(in_srgb,var(--tb-accent-dark)_22%,var(--background))] dark:focus-visible:text-[var(--tb-accent-dark)]"
                        : "text-muted-foreground hover:bg-[color-mix(in_srgb,var(--tb-accent-light)_10%,var(--background))] hover:text-[var(--tb-accent-light)] focus-visible:bg-[color-mix(in_srgb,var(--tb-accent-light)_10%,var(--background))] focus-visible:text-[var(--tb-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--tb-accent-dark)_12%,var(--background))] dark:hover:text-[var(--tb-accent-dark)] dark:focus-visible:bg-[color-mix(in_srgb,var(--tb-accent-dark)_12%,var(--background))] dark:focus-visible:text-[var(--tb-accent-dark)]",
                    )}
                  >
                    {multiSelect ? (
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                          isSelected
                            ? "border-current"
                            : "border-border/60 group-hover:border-[color-mix(in_srgb,var(--tb-accent-light)_45%,var(--border))] group-focus-visible:border-[color-mix(in_srgb,var(--tb-accent-light)_45%,var(--border))] dark:group-hover:border-[color-mix(in_srgb,var(--tb-accent-dark)_45%,var(--border))] dark:group-focus-visible:border-[color-mix(in_srgb,var(--tb-accent-dark)_45%,var(--border))]",
                        )}
                      >
                        {isSelected ? <Check className="size-3" aria-hidden={true} /> : null}
                      </span>
                    ) : null}

                    {Icon ? (
                      <Icon className="size-4 shrink-0 text-inherit" aria-hidden={true} />
                    ) : null}
                    <span className="truncate text-left">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        {footerContent ? (
          <div className="border-t border-border/50 p-1.5">{footerContent}</div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
