'use client';

import {
  Download,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import {
  DEFAULT_PROJECT_VERSION_SORT,
  EmptyState,
  ErrorBanner,
  ProjectVersionRow,
  ProjectVersionsHeader,
  ProjectVersionsLoadingState,
  ProjectVersionsShell,
  sortProjectVersions,
  toggleProjectVersionSort,
  type ProjectVersionSortField,
  type ProjectVersionSortState,
} from '@subway-builder-modded/asset-listings-ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@subway-builder-modded/shared-ui';
import type { VersionInfo } from '@/types/registry';

const VERSION_TEXT_FIELDS = new Set<string>();

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
  const [sort, setSort] = useState<ProjectVersionSortState>(
    DEFAULT_PROJECT_VERSION_SORT,
  );

  const handleSort = (field: ProjectVersionSortField) => {
    setSort((previous) => toggleProjectVersionSort(previous, field));
  };

  if (loading) {
    return <ProjectVersionsLoadingState />;
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
  const sorted = sortProjectVersions(versions, sort);

  return (
    <ProjectVersionsShell
      header={
        <ProjectVersionsHeader
          sort={sort}
          textFields={VERSION_TEXT_FIELDS}
          onSort={handleSort}
        />
      }
    >
      {sorted.map((v) => {
        const changelogHref = `/railyard/${type}/${itemId}/changelog/${encodeURIComponent(v.version)}`;
        const deepLinkHref = `railyard://open?type=${encodeURIComponent(type)}&id=${encodeURIComponent(itemId)}`;

        return (
          <ProjectVersionRow
            key={v.version}
            version={v.version}
            prerelease={v.prerelease}
            name={v.name && v.name !== v.version ? v.name : undefined}
            gameVersion={
              hasAnyGameVersion && v.game_version ? v.game_version : undefined
            }
            date={v.date}
            downloads={v.downloads}
            changelogHref={changelogHref}
            renderLink={(href, className, children) => (
              <Link href={href} className={className}>
                {children}
              </Link>
            )}
            action={
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
            }
          />
        );
      })}
    </ProjectVersionsShell>
  );
}
