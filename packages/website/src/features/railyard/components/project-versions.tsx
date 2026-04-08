'use client';

import { Download } from 'lucide-react';
import Link from 'next/link';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sbm/shared/ui/tooltip';
import { cn } from '../../../lib/utils';
import type { VersionInfo } from '../../../types/registry';
import { ProjectVersions as SharedProjectVersions } from '@sbm/shared/project/project-versions';
import type { SharedVersionInfo } from '@sbm/shared/railyard-core/shared-item';

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
  return (
    <SharedProjectVersions
      itemName={itemName}
      versions={versions as SharedVersionInfo[]}
      loading={loading}
      error={error}
      renderVersionLink={({ version: v, children, className }) => (
        <Link
          href={`/railyard/${type}/${itemId}/changelog/${encodeURIComponent(v.version)}`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderVersionAction={(v) => {
        const deepLinkHref = `railyard://open?type=${encodeURIComponent(type)}&id=${encodeURIComponent(itemId)}`;
        return (
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
        );
      }}
    />
  );
}
