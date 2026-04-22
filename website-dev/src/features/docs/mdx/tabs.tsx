import {
  createContext,
  type ReactNode,
  type ReactElement,
  useMemo,
  useState,
  useCallback,
  useEffect,
  Children,
  isValidElement,
} from "react";
import { cn } from "@/lib/utils";
import { resolveIcon } from "@/features/docs/lib/icon-resolver";

const TAB_STORAGE_PREFIX = "sbm-docs-tabs:";
export const TabsVariantContext = createContext<"default" | "code">("default");

type TabsProps = {
  groupId?: string;
  variant?: "default" | "code";
  children: ReactNode;
};

type TabItemProps = {
  value: string;
  label: string;
  icon?: ReactNode | string;
  default?: boolean;
  children: ReactNode;
};

function renderTabIcon(icon: ReactNode | string | undefined) {
  if (!icon) return null;

  if (typeof icon === "string") {
    const Icon = resolveIcon(icon);
    return <Icon className="size-3.5" aria-hidden={true} />;
  }

  return icon;
}

function getTabItems(children: ReactNode): ReactElement<TabItemProps>[] {
  const items: ReactElement<TabItemProps>[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement<TabItemProps>(child)) {
      items.push(child);
    }
  });
  return items;
}

function extractCodeTitle(node: ReactNode): string | null {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const child of node) {
      const title = extractCodeTitle(child);
      if (title) return title;
    }
    return null;
  }

  if (!isValidElement(node)) {
    return null;
  }

  const props = node.props as { title?: unknown; "data-language"?: unknown; children?: ReactNode };
  if (typeof props.title === "string" && props.title.trim().length > 0) {
    return props.title;
  }

  if (typeof props["data-language"] === "string" && props["data-language"].trim().length > 0) {
    return props["data-language"];
  }

  return extractCodeTitle(props.children);
}

export function Tabs({ groupId, variant = "default", children }: TabsProps) {
  const items = getTabItems(children);

  const defaultItem = items.find((item) => item.props.default) ?? items[0];
  const defaultValue = defaultItem?.props.value ?? "";

  const [active, setActive] = useState<string>(() => {
    if (groupId) {
      try {
        const stored = localStorage.getItem(`${TAB_STORAGE_PREFIX}${groupId}`);
        if (stored && items.some((item) => item.props.value === stored)) {
          return stored;
        }
      } catch {
        // localStorage unavailable
      }
    }
    return defaultValue;
  });

  const handleSelect = useCallback(
    (value: string) => {
      setActive(value);
      if (groupId) {
        try {
          localStorage.setItem(`${TAB_STORAGE_PREFIX}${groupId}`, value);
        } catch {
          // localStorage unavailable
        }
        window.dispatchEvent(
          new CustomEvent("sbm-tab-group-change", {
            detail: { groupId, value },
          }),
        );
      }
      window.dispatchEvent(new Event("sbm-docs-content-change"));
    },
    [groupId],
  );

  // Sync with other tab groups on the same page
  useEffect(() => {
    if (!groupId) return;

    function handleGroupChange(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail.groupId === groupId && items.some((item) => item.props.value === detail.value)) {
        setActive(detail.value);
      }
    }

    window.addEventListener("sbm-tab-group-change", handleGroupChange);
    return () => window.removeEventListener("sbm-tab-group-change", handleGroupChange);
  }, [groupId, items]);

  const activeContent = items.find((item) => item.props.value === active);
  const isCodeVariant = variant === "code";
  const activeCodeTitle = useMemo(
    () => (isCodeVariant ? extractCodeTitle(activeContent?.props.children) : null),
    [activeContent?.props.children, isCodeVariant],
  );

  return (
    <div
      className={cn(
        "my-4",
        isCodeVariant &&
          "overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-[0_12px_28px_-22px_rgba(var(--elevation-shadow-rgb),0.45)]",
      )}
      role="tablist"
      aria-orientation="horizontal"
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-border/60",
          isCodeVariant && "gap-1.5 border-border/60 bg-muted/35 p-1.5",
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {items.map((item) => {
            const isActive = item.props.value === active;
            return (
              <button
                key={item.props.value}
                role="tab"
                type="button"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleSelect(item.props.value)}
                onKeyDown={(e) => {
                  const idx = items.findIndex((i) => i.props.value === active);
                  if (e.key === "ArrowRight" && idx < items.length - 1) {
                    handleSelect(items[idx + 1].props.value);
                  } else if (e.key === "ArrowLeft" && idx > 0) {
                    handleSelect(items[idx - 1].props.value);
                  }
                }}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isCodeVariant
                    ? cn(
                        "inline-flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold",
                        isActive
                          ? "border-[color-mix(in_srgb,var(--suite-accent-light)_38%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_14%,transparent)] text-[var(--suite-accent-light)] shadow-sm dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_44%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)] dark:text-[var(--suite-accent-dark)]"
                          : "text-muted-foreground hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:hover:text-[var(--suite-accent-dark)]",
                      )
                    : isActive
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {item.props.icon ? (
                  <span className="shrink-0 text-current">{renderTabIcon(item.props.icon)}</span>
                ) : null}
                <span>{item.props.label}</span>
                {!isCodeVariant && isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--suite-accent-light)] dark:bg-[var(--suite-accent-dark)]" />
                )}
              </button>
            );
          })}
        </div>
        {isCodeVariant && activeCodeTitle ? (
          <span className="truncate px-2 text-xs font-medium text-muted-foreground">
            {activeCodeTitle}
          </span>
        ) : null}
      </div>
      <TabsVariantContext.Provider value={variant}>
        {items.map((item) => (
          <div
            key={item.props.value}
            role="tabpanel"
            hidden={item.props.value !== active}
            className={cn(isCodeVariant ? "[&>*]:my-0" : "pt-4")}
          >
            {item.props.children}
          </div>
        ))}
      </TabsVariantContext.Provider>
    </div>
  );
}

export function TabItem({ children }: TabItemProps) {
  return <>{children}</>;
}
