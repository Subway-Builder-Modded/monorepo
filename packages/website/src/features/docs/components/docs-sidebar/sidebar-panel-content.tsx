'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Archive, ChevronDown, PanelLeftCloseIcon, Tag } from 'lucide-react';
import { type DocsInstance, type DocsVersion } from '@/config/content/docs';
import {
  buildDocsHubHref,
  buildVersionedDocHref,
  getActiveInstanceFromPathname,
  getActiveVersionFromPathname,
  getDocSlugFromPathname,
  isLatestVersion,
  type DocsSidebarEntry,
  type DocsSidebarTree,
} from '@/lib/docs/shared';
import { cn } from '@/lib/utils';
import { PROJECT_COLOR_SCHEMES } from '@/config/theme/colors';
import { PageHeader } from '@/components/shared/page-header';
import {
  collectActiveCategoryKeys,
  findActiveEntry,
  getInstanceAccent,
  getInstanceBadgeScheme,
  getNeutralInteractiveBackground,
  getSidebarDepthClassName,
  getSidebarDepthToneClassName,
  getSidebarDepthTypographyClassName,
  getSwitcherIconBackground,
  getSwitcherRowBackground,
  removeCategoryBranch,
  withAlpha,
} from '@/features/docs/components/docs-sidebar/helpers';
import { useOnClickOutside } from '@/features/docs/components/docs-sidebar/hooks';

function VersionIcon({
  instance,
  version,
  accent,
  isDark,
}: {
  instance: DocsInstance;
  version: DocsVersion;
  accent: string;
  isDark: boolean;
}) {
  const latest = isLatestVersion(instance, version.value);
  const Icon = version.icon ?? (latest ? Tag : Archive);

  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground',
        latest && 'text-foreground',
      )}
      style={{
        backgroundColor: getSwitcherIconBackground(accent, isDark, latest),
        borderColor: latest ? withAlpha(accent, 0.5) : undefined,
        color: latest ? accent : undefined,
      }}
    >
      <Icon className="size-3.5" />
    </span>
  );
}

function StatusBadge({
  kind,
  accent,
}: {
  kind: 'latest' | 'deprecated';
  accent: string;
}) {
  if (kind === 'latest') {
    return (
      <span
        className="inline-flex h-4.5 items-center rounded-full border px-1.5 text-[9px] font-semibold normal-case tracking-[0.08em]"
        style={{
          borderColor: withAlpha(accent, 0.45),
          backgroundColor: withAlpha(accent, 0.1),
          color: accent,
        }}
      >
        Latest
      </span>
    );
  }

  return (
    <span className="inline-flex h-4.5 items-center rounded-full border border-border bg-muted px-1.5 text-[9px] font-semibold normal-case tracking-[0.08em] text-muted-foreground">
      Deprecated
    </span>
  );
}

function DropdownTrigger({
  open,
  accent,
  isDark,
  latestTone,
  onToggle,
  children,
}: {
  open: boolean;
  accent: string;
  isDark: boolean;
  latestTone: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const hoverBackground = latestTone
    ? withAlpha(accent, 0.08)
    : getNeutralInteractiveBackground(isDark, 0.06);

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (
          event.key === 'ArrowDown' ||
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          onToggle();
        }
      }}
      className="flex h-10 w-full items-center gap-2 rounded-lg border bg-card px-2.5 text-left text-sm shadow-xs transition-colors hover:bg-[var(--docs-switcher-trigger-hover-bg)]"
      style={{
        borderColor: open
          ? latestTone
            ? withAlpha(accent, 0.5)
            : getNeutralInteractiveBackground(isDark, 0.2)
          : undefined,
        backgroundColor: open ? hoverBackground : undefined,
        ['--docs-switcher-trigger-hover-bg' as string]: hoverBackground,
      }}
    >
      {children}
      <ChevronDown
        className={cn(
          'ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-150',
          open && 'rotate-180',
        )}
        style={open ? { color: accent } : undefined}
      />
    </button>
  );
}

function DropdownPanel({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid transition-all duration-200 ease-out',
        open
          ? 'mt-1.5 grid-rows-[1fr] opacity-100'
          : 'mt-0 grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="min-h-0 overflow-x-visible overflow-y-hidden">
        <div className="overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md ring-1 ring-foreground/8">
          {children}
        </div>
      </div>
    </div>
  );
}

function VersionDropdownRow({
  instance,
  version,
  isActive,
  href,
  isDark,
}: {
  instance: DocsInstance;
  version: DocsVersion;
  isActive: boolean;
  href: string;
  isDark: boolean;
}) {
  const accent = getInstanceAccent(instance, isDark);
  const latest = isLatestVersion(instance, version.value);
  const [hovered, setHovered] = React.useState(false);
  const highlighted = isActive || hovered;

  return (
    <NextLink
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
      style={
        highlighted
          ? {
              backgroundColor: getSwitcherRowBackground({
                accent,
                isDark,
                latest,
                highlighted,
              }),
              color: latest ? accent : undefined,
            }
          : undefined
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <VersionIcon
        instance={instance}
        version={version}
        accent={accent}
        isDark={isDark}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate font-medium">{version.label}</span>
          {latest ? <StatusBadge kind="latest" accent={accent} /> : null}
          {version.deprecated ? (
            <StatusBadge kind="deprecated" accent={accent} />
          ) : null}
        </div>
      </div>
    </NextLink>
  );
}

function SidebarActiveIndicator({
  active,
  accent,
}: {
  active: boolean;
  accent: string;
}) {
  return (
    <span
      className={cn(
        'absolute top-1.5 bottom-1.5 right-0 w-[2px] rounded-full transition-opacity duration-200',
        active ? 'opacity-100' : 'opacity-0',
      )}
      style={{ backgroundColor: accent }}
    />
  );
}

function SidebarDocsHeader({
  activeInstance,
}: {
  activeInstance: DocsInstance;
}) {
  const headerTitle = 'Docs';
  const HeaderIcon = activeInstance.sidebarHeader?.icon ?? activeInstance.icon;
  const instanceBadgeScheme = getInstanceBadgeScheme(activeInstance);

  return (
    <PageHeader
      icon={HeaderIcon}
      title={headerTitle}
      colorScheme={{
        accent: PROJECT_COLOR_SCHEMES[activeInstance.id].accentColor,
        spotlight: {
          light: withAlpha(
            PROJECT_COLOR_SCHEMES[activeInstance.id].accentColor.light,
            0.18,
          ),
          dark: withAlpha(
            PROJECT_COLOR_SCHEMES[activeInstance.id].accentColor.dark,
            0.23,
          ),
        },
      }}
      badges={[
        {
          text: activeInstance.label,
          icon: activeInstance.icon,
          colorScheme: instanceBadgeScheme,
        },
      ]}
      size="sidebar"
      className="mb-4 w-full"
    />
  );
}

function VersionSwitcher({
  activeInstance,
  activeVersion,
  pathname,
  open,
  setOpen,
  versionDocSlugs,
  isDark,
}: {
  activeInstance: DocsInstance;
  activeVersion: NonNullable<ReturnType<typeof getActiveVersionFromPathname>>;
  pathname: string;
  open: boolean;
  setOpen: (value: boolean) => void;
  versionDocSlugs?: Record<string, string[]>;
  isDark: boolean;
}) {
  const currentDocSlug = getDocSlugFromPathname(activeInstance, pathname);
  if (!activeInstance.versioned || !activeInstance.versions?.length)
    return null;

  const accent = getInstanceAccent(activeInstance, isDark);
  const latestTone = isLatestVersion(activeInstance, activeVersion.value);

  return (
    <div>
      <DropdownTrigger
        open={open}
        accent={accent}
        isDark={isDark}
        latestTone={latestTone}
        onToggle={() => setOpen(!open)}
      >
        <VersionIcon
          instance={activeInstance}
          version={activeVersion}
          accent={accent}
          isDark={isDark}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">
              {activeVersion.label}
            </span>
            {isLatestVersion(activeInstance, activeVersion.value) ? (
              <StatusBadge kind="latest" accent={accent} />
            ) : null}
            {activeVersion.deprecated ? (
              <StatusBadge kind="deprecated" accent={accent} />
            ) : null}
          </div>
        </div>
      </DropdownTrigger>

      <DropdownPanel open={open}>
        <div className="space-y-0.5">
          {activeInstance.versions.map((version) => {
            const targetDocSlugs = versionDocSlugs?.[version.value] ?? [];
            const targetHref =
              currentDocSlug && targetDocSlugs.includes(currentDocSlug)
                ? buildVersionedDocHref(activeInstance, version.value, pathname)
                : buildDocsHubHref(activeInstance);

            return (
              <VersionDropdownRow
                key={version.value}
                instance={activeInstance}
                version={version}
                isActive={version.value === activeVersion.value}
                href={targetHref}
                isDark={isDark}
              />
            );
          })}
        </div>
      </DropdownPanel>
    </div>
  );
}

function SidebarNavEntry({
  entry,
  pathname,
  openKeys,
  setOpenKeys,
  accent,
  depth = 0,
  activeIndicatorKey,
}: {
  entry: DocsSidebarEntry;
  pathname: string;
  openKeys: Set<string>;
  setOpenKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
  accent: string;
  depth?: number;
  activeIndicatorKey: string | null;
}) {
  if (entry.kind === 'page') {
    const showIndicator = activeIndicatorKey === entry.key;
    const hoverBackground = withAlpha(accent, 0.1);
    const activeStyle = showIndicator
      ? {
          backgroundColor: hoverBackground,
          color: accent,
        }
      : undefined;

    return (
      <li className="relative">
        <SidebarActiveIndicator active={showIndicator} accent={accent} />
        <div
          className={cn(
            'relative flex w-full items-center rounded-md transition-colors',
            showIndicator
              ? 'text-foreground'
              : cn(
                  getSidebarDepthToneClassName(),
                  'hover:bg-[var(--docs-sidebar-hover-bg)] hover:text-[var(--docs-sidebar-hover-fg)]',
                ),
          )}
          style={{
            ...(activeStyle ?? {}),
            ['--docs-sidebar-hover-bg' as string]: hoverBackground,
            ['--docs-sidebar-hover-fg' as string]: accent,
          }}
        >
          <NextLink
            href={entry.href}
            className={cn(
              'min-w-0 flex-1 px-2.5 py-1.5 pr-3',
              getSidebarDepthClassName(depth),
              getSidebarDepthTypographyClassName(depth),
            )}
          >
            <span className="block truncate">{entry.title}</span>
          </NextLink>
          <span
            aria-hidden="true"
            className="mr-1 flex size-6 items-center justify-center rounded-sm text-transparent"
          >
            <ChevronDown className="size-3.5 opacity-0" />
          </span>
        </div>
      </li>
    );
  }

  const isOpen = openKeys.has(entry.key);
  const showIndicator = activeIndicatorKey === entry.key;

  const toggle = () => {
    setOpenKeys((prev) => {
      if (prev.has(entry.key)) {
        return removeCategoryBranch(entry, prev);
      }

      const next = new Set(prev);
      next.add(entry.key);
      return next;
    });
  };

  const onMainClick = () => {
    setOpenKeys((prev) => {
      if (!entry.href) {
        if (prev.has(entry.key)) {
          return removeCategoryBranch(entry, prev);
        }

        const next = new Set(prev);
        next.add(entry.key);
        return next;
      }

      if (prev.has(entry.key)) {
        return prev;
      }

      const next = new Set(prev);
      next.add(entry.key);
      return next;
    });
  };

  const rowClassName = cn(
    'group relative flex w-full items-center rounded-md transition-colors',
    showIndicator
      ? 'text-foreground'
      : cn(
          getSidebarDepthToneClassName(),
          'hover:bg-[var(--docs-sidebar-hover-bg)] hover:text-[var(--docs-sidebar-hover-fg)]',
        ),
  );

  const labelClassName = cn(
    'min-w-0 flex-1 px-2.5 py-1.5 pr-3 text-left',
    getSidebarDepthClassName(depth),
    getSidebarDepthTypographyClassName(depth),
  );

  const hoverBackground = withAlpha(accent, 0.1);
  const activeStyle = showIndicator
    ? {
        backgroundColor: hoverBackground,
        color: accent,
      }
    : undefined;

  return (
    <li>
      <div
        className={rowClassName}
        style={{
          ...(activeStyle ?? {}),
          ['--docs-sidebar-hover-bg' as string]: hoverBackground,
          ['--docs-sidebar-hover-fg' as string]: accent,
        }}
      >
        <SidebarActiveIndicator active={showIndicator} accent={accent} />

        {entry.href ? (
          <NextLink
            href={entry.href}
            onClick={onMainClick}
            className={labelClassName}
          >
            <span className="truncate">{entry.title}</span>
          </NextLink>
        ) : (
          <button
            type="button"
            onClick={onMainClick}
            className={labelClassName}
          >
            <span className="truncate">{entry.title}</span>
          </button>
        )}

        <button
          type="button"
          aria-label={
            isOpen ? `Collapse ${entry.title}` : `Expand ${entry.title}`
          }
          onClick={toggle}
          className="mr-1 flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors group-hover:text-[var(--docs-sidebar-hover-fg)]"
        >
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
            style={showIndicator ? { color: accent } : undefined}
          />
        </button>
      </div>

      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="space-y-0.5 py-0.5">
            {entry.items.map((child) => (
              <SidebarNavEntry
                key={child.key}
                entry={child}
                pathname={pathname}
                openKeys={openKeys}
                setOpenKeys={setOpenKeys}
                depth={depth + 1}
                activeIndicatorKey={activeIndicatorKey}
                accent={accent}
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

export function SidebarPanelContent({
  tree,
  versionDocSlugs,
  scrollRef,
  onCollapse,
  onStructureChange,
}: {
  tree?: DocsSidebarTree;
  versionDocSlugs?: Record<string, string[]>;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onCollapse?: () => void;
  onStructureChange?: () => void;
}) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme !== 'light' : false;

  const activeInstance = React.useMemo(
    () => getActiveInstanceFromPathname(pathname),
    [pathname],
  );
  const activeVersion = React.useMemo(
    () => getActiveVersionFromPathname(activeInstance, pathname),
    [activeInstance, pathname],
  );

  const [isVersionDropdownOpen, setIsVersionDropdownOpen] =
    React.useState(false);
  const [openKeys, setOpenKeys] = React.useState<Set<string>>(() =>
    collectActiveCategoryKeys(tree?.entries ?? [], pathname),
  );

  const versionSwitcherRef = React.useRef<HTMLDivElement | null>(null);
  useOnClickOutside(versionSwitcherRef, () => setIsVersionDropdownOpen(false));

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsVersionDropdownOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  React.useEffect(() => {
    setIsVersionDropdownOpen(false);
  }, [pathname]);

  React.useLayoutEffect(() => {
    setOpenKeys(collectActiveCategoryKeys(tree?.entries ?? [], pathname));
  }, [tree?.entries, pathname]);

  React.useLayoutEffect(() => {
    onStructureChange?.();
  }, [
    onStructureChange,
    openKeys,
    isVersionDropdownOpen,
    tree?.entries,
    pathname,
  ]);

  const activeIndicatorKey = React.useMemo(() => {
    const entry = findActiveEntry(tree?.entries ?? [], pathname, openKeys);
    return entry?.key ?? null;
  }, [tree?.entries, pathname, openKeys]);

  const accent = getInstanceAccent(activeInstance, isDark);

  return (
    <>
      <div className="shrink-0 border-b border-border/60 px-[clamp(0.65rem,1.4vw,1rem)] pt-[clamp(0.65rem,1.4vw,1rem)] pb-[clamp(0.42rem,0.88vw,0.6rem)]">
        <div className={cn('space-y-3', !mounted && 'invisible')}>
          <div className="relative flex items-start justify-center">
            <SidebarDocsHeader activeInstance={activeInstance} />
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Collapse docs sidebar"
                className="pointer-events-auto absolute right-0 top-0 z-20 mt-0.5 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent/45 hover:text-primary"
              >
                <PanelLeftCloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {activeInstance.versioned && activeVersion ? (
            <div ref={versionSwitcherRef}>
              <VersionSwitcher
                activeInstance={activeInstance}
                activeVersion={activeVersion}
                pathname={pathname}
                open={isVersionDropdownOpen}
                setOpen={setIsVersionDropdownOpen}
                versionDocSlugs={versionDocSlugs}
                isDark={isDark}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-clip px-[clamp(0.65rem,1.4vw,1rem)] py-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onWheelCapture={(event) => event.stopPropagation()}
      >
        <nav aria-label="Docs navigation">
          <ul className="space-y-0.5">
            {(tree?.entries ?? []).map((entry) => (
              <SidebarNavEntry
                key={entry.key}
                entry={entry}
                pathname={pathname}
                openKeys={openKeys}
                setOpenKeys={setOpenKeys}
                activeIndicatorKey={activeIndicatorKey}
                accent={accent}
              />
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
