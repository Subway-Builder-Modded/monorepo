'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import * as TabsPrimitive from '@radix-ui/react-tabs';

type TabItemProps = {
  value: string;
  label?: string;
  children: React.ReactNode;
  default?: boolean;
};

type TabsProps = {
  children: React.ReactNode;
  defaultValue?: string | null;
  groupId?: string;
  className?: string;
};

const GROUP_STORAGE_PREFIX = 'Docs-tabs:';

// Normalize tab values into DOM-safe ID fragments so trigger/content pairs stay stable.
function toIdPart(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'tab';
}

// Generate a deterministic per-instance suffix instead of relying on runtime-generated IDs.
function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function getStoredGroupValue(groupId: string) {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(`${GROUP_STORAGE_PREFIX}${groupId}`);
}

function setStoredGroupValue(groupId: string, value: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${GROUP_STORAGE_PREFIX}${groupId}`, value);
  window.dispatchEvent(
    new CustomEvent('mdx-tab-group-change', {
      detail: { groupId, value },
    }),
  );
}

export function Tabs({
  children,
  defaultValue,
  groupId,
  className,
}: TabsProps) {
  const items = React.Children.toArray(children).filter(
    React.isValidElement<TabItemProps>,
  ) as React.ReactElement<TabItemProps>[];

  const values = items.map((item) => ({
    value: item.props.value,
    label: item.props.label ?? item.props.value,
    default: item.props.default,
  }));

  // Resolve the initial tab without touching browser-only storage during render,
  // so the server output and first client render hydrate to the same markup.
  const initialValue = React.useMemo(() => {
    if (defaultValue !== undefined) return defaultValue ?? undefined;

    const explicitDefault = values.find((v) => v.default);
    if (explicitDefault) return explicitDefault.value;

    return values[0]?.value;
  }, [defaultValue, values]);

  const [activeValue, setActiveValue] = React.useState<string | undefined>(
    initialValue,
  );

  // Build a stable tabset ID from serializable props/content so our aria links are
  // identical on the server and client.
  const tabsInstanceId = React.useMemo(() => {
    const signature = JSON.stringify({
      groupId: groupId ?? null,
      defaultValue: defaultValue ?? null,
      values: values.map((item) => item.value),
    });

    return `mdx-tabs-${hashString(signature)}`;
  }, [defaultValue, groupId, values]);

  React.useEffect(() => {
    if (!groupId) return;

    // Apply any persisted grouped-tab preference after mount to avoid hydration
    // mismatches from reading localStorage during the initial render.
    const stored = getStoredGroupValue(groupId);
    if (stored && values.some((v) => v.value === stored)) {
      setActiveValue(stored);
      return;
    }

    setActiveValue(initialValue);
  }, [groupId, initialValue, values]);

  React.useEffect(() => {
    if (!groupId) return;

    function onGroupChange(event: Event) {
      const customEvent = event as CustomEvent<{
        groupId: string;
        value: string;
      }>;
      if (customEvent.detail.groupId !== groupId) return;

      const nextValue = customEvent.detail.value;
      if (values.some((v) => v.value === nextValue)) {
        setActiveValue(nextValue);
      }
    }

    window.addEventListener('mdx-tab-group-change', onGroupChange);
    return () =>
      window.removeEventListener('mdx-tab-group-change', onGroupChange);
  }, [groupId, values]);

  function handleValueChange(value: string) {
    setActiveValue(value);
    if (groupId) setStoredGroupValue(groupId, value);
    window.dispatchEvent(
      new CustomEvent('mdx-tab-change', {
        detail: { value, tabsInstanceId, groupId: groupId ?? null },
      }),
    );
  }

  return (
    <TabsPrimitive.Root
      value={activeValue}
      onValueChange={handleValueChange}
      className={cn('my-6', className)}
    >
      <TabsPrimitive.List
        className={cn('mb-4 flex w-full items-end gap-6 bg-transparent p-0')}
      >
        {values.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            // Use explicit deterministic IDs so Radix doesn't generate different
            // trigger/content linkage across server and client renders.
            id={`${tabsInstanceId}-trigger-${toIdPart(item.value)}`}
            aria-controls={`${tabsInstanceId}-content-${toIdPart(item.value)}`}
            className={cn(
              'relative -mb-px inline-flex items-center rounded-none border-0 bg-transparent px-0 pb-2.5 pt-0',
              'text-[1.15rem] font-semibold tracking-tight',
              'text-muted-foreground',
              'transition-colors duration-150 ease-out',
              'hover:bg-transparent hover:text-foreground/80',
              'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
              "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:scale-x-0 after:bg-primary after:transition-transform after:duration-150 after:ease-out after:content-['']",
              'data-[state=active]:text-primary data-[state=active]:after:scale-x-100',
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.props.value}
          value={item.props.value}
          id={`${tabsInstanceId}-content-${toIdPart(item.props.value)}`}
          aria-labelledby={`${tabsInstanceId}-trigger-${toIdPart(item.props.value)}`}
          className="mt-0 border-0 bg-transparent p-0 outline-none"
        >
          <div className="[&>p:first-child]:mt-0">{item.props.children}</div>
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

export function TabItem({ children }: TabItemProps) {
  return <>{children}</>;
}
