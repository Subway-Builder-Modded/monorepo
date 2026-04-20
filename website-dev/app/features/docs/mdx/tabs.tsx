import { type ReactNode, type ReactElement, useState, useCallback, useEffect, Children, isValidElement } from "react";
import { cn } from "@/app/lib/utils";

const TAB_STORAGE_PREFIX = "sbm-docs-tabs:";

type TabsProps = {
  groupId?: string;
  children: ReactNode;
};

type TabItemProps = {
  value: string;
  label: string;
  default?: boolean;
  children: ReactNode;
};

function getTabItems(children: ReactNode): ReactElement<TabItemProps>[] {
  const items: ReactElement<TabItemProps>[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement<TabItemProps>(child)) {
      items.push(child);
    }
  });
  return items;
}

export function Tabs({ groupId, children }: TabsProps) {
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

  return (
    <div className="my-4" role="tablist" aria-orientation="horizontal">
      <div className="flex border-b border-border/60">
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
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.props.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--suite-accent-light)] dark:bg-[var(--suite-accent-dark)]" />
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="pt-4">
        {activeContent?.props.children}
      </div>
    </div>
  );
}

export function TabItem({ children }: TabItemProps) {
  return <>{children}</>;
}
