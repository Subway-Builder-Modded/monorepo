'use client';

import {
  ArrowDownToLine,
  Calendar,
  Download,
  FileText,
  Tag,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

import { EmptyState } from '@/features/railyard/components/empty-state';
import { ErrorBanner } from '@/features/railyard/components/error-banner';
import { SortableHeaderCell } from '@/features/railyard/components/sortable-header-cell';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { VersionInfo } from '@/types/registry';

type VersionSortField = 'version' | 'date' | 'downloads';
interface VersionSortState {
  field: VersionSortField;
  direction: 'asc' | 'desc';
}

const VERSION_TEXT_FIELDS = new Set<string>();
const DEFAULT_SORT: VersionSortState = { field: 'date', direction: 'desc' };

function coerceVersion(v: string): number[] {
  const normalized = v.startsWith('v') ? v.slice(1) : v;
  return normalized.split('.').map((n) => parseInt(n, 10) || 0);
}

function compareVersions(a: string, b: string): number {
  const av = coerceVersion(a);
  const bv = coerceVersion(b);
  for (let i = 0; i < Math.max(av.length, bv.length); i++) {
    const diff = (av[i] ?? 0) - (bv[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function sortVersions(
  versions: VersionInfo[],
  sort: VersionSortState,
): VersionInfo[] {
  return [...versions].sort((a, b) => {
    let cmp = 0;
    if (sort.field === 'date') {
      cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sort.field === 'downloads') {
      cmp = a.downloads - b.downloads;
    } else {
      cmp = compareVersions(a.version, b.version);
    }
    return sort.direction === 'asc' ? cmp : -cmp;
  });
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

interface ProjectVersionsProps {
  type: 'mods' | 'maps';
  itemId: string;
  itemName: string;
  versions: VersionInfo[];
  loading: boolean;
  error: string | null;
}

export function ProjectVersions({
  type,
  itemId,
  itemName,
  versions,
  loading,
  error,
}: ProjectVersionsProps) {
  const [sort, setSort] = useState<VersionSortState>(DEFAULT_SORT);

  const handleSort = (field: VersionSortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'desc' },
    );
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/20 px-4 py-2">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="divide-y divide-border/50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (versions.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No versions available"
        description={`No versions are available for ${itemName}.`}
      />
    );
  }

  const hasAnyGameVersion = versions.some((v) => v.game_version);
  const sorted = sortVersions(versions, sort);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-4 border-b border-border bg-muted/20 px-4 py-2">
        <div className="flex-1 min-w-0">
          <SortableHeaderCell
            label="Version"
            field="version"
            icon={Tag}
            sort={sort}
            textFields={VERSION_TEXT_FIELDS}
            onSort={handleSort}
          />
        </div>
        <div className="w-[7rem] shrink-0 hidden sm:block">
          <SortableHeaderCell
            label="Date"
            field="date"
            icon={Calendar}
            sort={sort}
            textFields={VERSION_TEXT_FIELDS}
            onSort={handleSort}
          />
        </div>
        <div className="w-[6.5rem] shrink-0 hidden lg:block">
          <SortableHeaderCell
            label="Downloads"
            field="downloads"
            icon={ArrowDownToLine}
            sort={sort}
            textFields={VERSION_TEXT_FIELDS}
            onSort={handleSort}
          />
        </div>
        <div
          className="hidden lg:block w-px self-stretch bg-border/50 mx-2"
          aria-hidden
        />
        <div
          className="w-[7rem] shrink-0 flex items-center justify-center"
          aria-hidden
        />
      </div>

      <div className="divide-y divide-border/50">
        {sorted.map((v) => {
          const changelogHref = `/railyard/${type}/${itemId}/changelog/${encodeURIComponent(v.version)}`;
          const deepLinkHref = `railyard://open?type=${encodeURIComponent(type)}&id=${encodeURIComponent(itemId)}`;

          return (
            <div
              key={v.version}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={changelogHref}
                  className="group inline-flex flex-col"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground group-hover:underline">
                      {v.version}
                    </span>
                    {v.prerelease && (
                      <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-400 text-xs">
                        Beta
                      </Badge>
                    )}
                  </span>
                  {v.name && v.name !== v.version && (
                    <span className="mt-0.5 text-xs text-muted-foreground truncate max-w-[20rem]">
                      {v.name}
                    </span>
                  )}
                </Link>
                {hasAnyGameVersion && v.game_version && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {v.game_version}
                  </span>
                )}
              </div>

              <div className="w-[7rem] shrink-0 hidden sm:block">
                <span className="text-sm text-muted-foreground">
                  {formatDate(v.date)}
                </span>
              </div>

              <div className="w-[6.5rem] shrink-0 hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
                <ArrowDownToLine className="h-3.5 w-3.5" />
                {v.downloads.toLocaleString()}
              </div>

              <div className="hidden lg:block w-px self-stretch bg-border/50 mx-2" />
              <div className="w-[7rem] shrink-0 flex items-center justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          window.location.href = deepLinkHref;
                        }}
                        className={cn(
                          'inline-flex items-center justify-center rounded-lg border transition-colors',
                          'h-7 w-7',
                          'border-[var(--suite-accent-light)] text-[var(--suite-accent-light)]',
                          'hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)]',
                          'dark:border-[var(--suite-accent-dark)] dark:text-[var(--suite-accent-dark)]',
                          'dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_20%,transparent)]',
                        )}
                        aria-label="Open in Railyard"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      data-color-scheme="railyard"
                      className="bg-[var(--suite-accent-light)] text-[var(--suite-text-inverted-light)] dark:bg-[var(--suite-accent-dark)] dark:text-[var(--suite-text-inverted-dark)]"
                      arrowClassName="bg-[var(--suite-accent-light)] fill-[var(--suite-accent-light)] dark:bg-[var(--suite-accent-dark)] dark:fill-[var(--suite-accent-dark)]"
                    >
                      Open in Railyard
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
