import {
  createContext,
  type ComponentType,
  type ReactNode,
  type ReactElement,
  useMemo,
  useState,
  useCallback,
  useEffect,
  Children,
  isValidElement,
} from "react";
import { cx } from "../lib/cx.ts";

const TAB_STORAGE_PREFIX = "sbm-mdx-tabs:";
export const TabsVariantContext = createContext<"default" | "code">("default");

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export type IconResolver = (iconName: string) => IconComponent;

type TabsProps = {
  groupId?: string;
  variant?: "default" | "code";
  resolveIcon?: IconResolver;
  children?: ReactNode;
};

type TabItemProps = {
  value?: string;
  label: string;
  icon?: ReactNode | string;
  default?: boolean;
  children: ReactNode;
};

function renderTabIcon(icon: ReactNode | string | undefined, resolveIcon?: IconResolver) {
  if (!icon) return null;

  if (typeof icon === "string") {
    if (!resolveIcon) {
      return null;
    }
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

function getItemValue(item: ReactElement<TabItemProps>, index: number): string {
  const rawValue = item.props.value;
  if (typeof rawValue === "string" && rawValue.trim().length > 0) {
    return rawValue;
  }
  return `tab-${index}`;
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

export function Tabs({ groupId, variant = "default", resolveIcon, children }: TabsProps) {
  const items = getTabItems(children);

  const defaultIndex = items.findIndex((item) => item.props.default);
  const resolvedDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0;
  const defaultItem = items[resolvedDefaultIndex];
  const defaultValue = defaultItem ? getItemValue(defaultItem, resolvedDefaultIndex) : "";

  const [active, setActive] = useState<string>(() => {
    if (groupId && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`${TAB_STORAGE_PREFIX}${groupId}`);
        if (stored && items.some((item, index) => getItemValue(item, index) === stored)) {
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
      if (groupId && typeof window !== "undefined") {
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("sbm-docs-content-change"));
      }
    },
    [groupId],
  );

  useEffect(() => {
    if (!groupId || typeof window === "undefined") return;

    function handleGroupChange(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (
        detail.groupId === groupId &&
        items.some((item, index) => getItemValue(item, index) === detail.value)
      ) {
        setActive(detail.value);
      }
    }

    window.addEventListener("sbm-tab-group-change", handleGroupChange);
    return () => window.removeEventListener("sbm-tab-group-change", handleGroupChange);
  }, [groupId, items]);

  const activeContent = items.find((item, index) => getItemValue(item, index) === active);
  const isCodeVariant = variant === "code";
  const activeCodeTitle = useMemo(
    () => (isCodeVariant ? extractCodeTitle(activeContent?.props.children) : null),
    [activeContent?.props.children, isCodeVariant],
  );

  return (
    <div
      className={cx(
        "my-4",
        isCodeVariant &&
          "overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-[0_12px_28px_-22px_rgba(var(--elevation-shadow-rgb),0.45)]",
      )}
      role="tablist"
      aria-orientation="horizontal"
    >
      <div
        className={cx(
          "flex items-center justify-between border-b border-border/60",
          isCodeVariant && "gap-1.5 border-border/60 bg-muted/35 p-1.5",
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {items.map((item, index) => {
            const itemValue = getItemValue(item, index);
            const isActive = itemValue === active;
            return (
              <button
                key={itemValue}
                role="tab"
                type="button"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleSelect(itemValue)}
                onKeyDown={(e) => {
                  const idx = items.findIndex((i, iIndex) => getItemValue(i, iIndex) === active);
                  if (e.key === "ArrowRight" && idx < items.length - 1) {
                    handleSelect(getItemValue(items[idx + 1], idx + 1));
                  } else if (e.key === "ArrowLeft" && idx > 0) {
                    handleSelect(getItemValue(items[idx - 1], idx - 1));
                  }
                }}
                className={cx(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isCodeVariant
                    ? cx(
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
                  <span className="shrink-0 text-current">
                    {renderTabIcon(item.props.icon, resolveIcon)}
                  </span>
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
        {items.map((item, index) => {
          const itemValue = getItemValue(item, index);
          return (
            <div
              key={itemValue}
              role="tabpanel"
              hidden={itemValue !== active}
              className={cx(isCodeVariant ? "[&>*]:my-0" : "pt-4")}
            >
              {item.props.children}
            </div>
          );
        })}
      </TabsVariantContext.Provider>
    </div>
  );
}

export function TabItem({ children }: TabItemProps) {
  return <>{children}</>;
}
